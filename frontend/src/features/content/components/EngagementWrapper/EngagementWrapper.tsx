import {
    cloneElement,
    isValidElement,
    useCallback,
    useEffect,
    useRef,
} from "react";
import type { ReactElement } from "react";

const VISIBILITY_THRESHOLD = 0.5;
const MIN_DWELL_MS = 1000;
const INACTIVITY_LIMIT_MS = 30_000;
const TICK_INTERVAL_MS = 1000;
const MIN_DURATION_MS = 3000;
// Time after mount before we trust this is a real mount (not a Strict-Mode
// synthetic mount). Synthetic unmount fires within microseconds; 100ms is far
// past that but far below any realistic user interaction.
const STRICT_MODE_GUARD_MS = 100;

const ACTIVITY_EVENTS = [
    "click",
    "keydown",
    "scroll",
    "touchstart",
    "pointermove",
] as const;

export type EngagementSnapshot = {
    engagement_id: string;
    started_at: string;
    engagement_end?: string;
    active_duration_ms: number;
};

export type AttemptPayload = {
    interaction_type: string;
    submitted_at?: string;
    response?: string;
    is_correct?: boolean | null;
    score?: number | null;
    attempt_number: number;
    metadata?: Record<string, any>;
    graded_at?: string;
    grading_status?: string;
    grading_feedback?: string;
};

export type InteractionRecord = AttemptPayload &
    EngagementSnapshot & {
        content_id: number;
        content_type: string;
    };

export type EngagementRecord = EngagementSnapshot & {
    content_id: number;
    content_type: string;
};

type Props = {
    contentId: number;
    contentType: string;
    onInteraction?: (record: InteractionRecord) => Promise<void> | void;
    onEngagementEnd?: (record: EngagementRecord) => Promise<void> | void;
    children: ReactElement<{
        onInteraction?: (payload: AttemptPayload) => Promise<void> | void;
        onAttemptRetry?: () => void;
    }>;
};

const newEngagementId = (): string => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `eng_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

/**
 * Runs `fn` on either React unmount or `pagehide` (whichever happens first).
 * The caller is expected to guard against re-entry with its own ref so the
 * idempotent invocation here doesn't double-fire side effects.
 */
export function useFinalize(fn: () => void) {
    const fnRef = useRef(fn);
    useEffect(() => {
        fnRef.current = fn;
    });

    useEffect(() => {
        const handler = () => {
            fnRef.current();
        };
        window.addEventListener("pagehide", handler);
        return () => {
            window.removeEventListener("pagehide", handler);
            handler();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}

const EngagementWrapper = ({
    contentId,
    contentType,
    onInteraction,
    onEngagementEnd,
    children,
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const engagementIdRef = useRef<string>("");
    if (!engagementIdRef.current) {
        engagementIdRef.current = newEngagementId();
    }

    const startedAtRef = useRef<string | null>(null);
    const activeDurationMsRef = useRef<number>(0);
    const lastActiveAtMsRef = useRef<number>(0);
    // Wall-clock ms of the last moment this block was actually engaged with
    // (visible + within the active-duration tick). When the block scrolls out
    // of view it stops advancing, so a later tab close/unmount uses this
    // value as engagement_end instead of "now" — each block keeps its own.
    const lastEngagedAtMsRef = useRef<number>(0);
    const isVisibleRef = useRef<boolean>(false);
    const dwellTimerRef = useRef<number | null>(null);
    const tickerRef = useRef<number | null>(null);
    const wasMountedRef = useRef<boolean>(false);
    const attemptsCountRef = useRef<number>(0);
    const engagementEndFiredRef = useRef<boolean>(false);

    const snapshot = useCallback(
        (includeEnd: boolean): EngagementSnapshot => {
            const startedAt =
                startedAtRef.current ?? new Date().toISOString();

            let engagementEnd: string | undefined = undefined;
            if (includeEnd) {
                // If the block is currently visible we use "now" — engagement
                // is still active right up to the finalize moment. Otherwise
                // use the last tracked engaged moment, which is when the
                // block actually became disengaged.
                const endMs =
                    isVisibleRef.current || lastEngagedAtMsRef.current === 0
                        ? Date.now()
                        : lastEngagedAtMsRef.current;
                engagementEnd = new Date(endMs).toISOString();
            }

            return {
                engagement_id: engagementIdRef.current,
                started_at: startedAt,
                engagement_end: engagementEnd,
                active_duration_ms: activeDurationMsRef.current,
            };
        },
        []
    );

    const wrappedOnInteraction = useCallback(
        async (attempt: AttemptPayload) => {
            // Strict-Mode synthetic unmount fires within microseconds; this
            // guard prevents spurious POSTs from block cleanups that run
            // during dev-mode double-mount.
            if (!wasMountedRef.current) return;

            attemptsCountRef.current += 1;
            if (!onInteraction) return;
            await onInteraction({
                ...attempt,
                ...snapshot(false),
                content_id: contentId,
                content_type: contentType,
            });
        },
        [onInteraction, snapshot, contentId, contentType]
    );

    // Called by graded blocks on retry. Flushes the current attempt's
    // engagement window (PATCH happens parent-side) and rotates to a fresh
    // engagement_id so the next attempt is a new row's worth of timing.
    const handleAttemptRetry = useCallback(() => {
        if (!wasMountedRef.current) return;

        // Flush current engagement if it has any attempts behind it.
        if (attemptsCountRef.current > 0 && onEngagementEnd) {
            const final: EngagementRecord = {
                ...snapshot(true),
                content_id: contentId,
                content_type: contentType,
            };
            void onEngagementEnd(final);
        }

        // Rotate.
        engagementIdRef.current = newEngagementId();
        const now = Date.now();
        startedAtRef.current = new Date(now).toISOString();
        lastActiveAtMsRef.current = now;
        lastEngagedAtMsRef.current = now;
        activeDurationMsRef.current = 0;
        attemptsCountRef.current = 0;
        engagementEndFiredRef.current = false;
    }, [snapshot, contentId, contentType, onEngagementEnd]);

    // Fires onEngagementEnd. Used by both React unmount and pagehide.
    const finalizeEngagement = useCallback(() => {
        if (!wasMountedRef.current) return;
        if (engagementEndFiredRef.current) return;

        const tooShort = activeDurationMsRef.current < MIN_DURATION_MS;
        const noAttempts = attemptsCountRef.current === 0;
        if (tooShort && noAttempts) return;

        if (!onEngagementEnd) return;

        engagementEndFiredRef.current = true;

        const final: EngagementRecord = {
            ...snapshot(true),
            content_id: contentId,
            content_type: contentType,
        };
        void onEngagementEnd(final);
    }, [snapshot, contentId, contentType, onEngagementEnd]);

    useFinalize(finalizeEngagement);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const mountGuardTimer = window.setTimeout(() => {
            wasMountedRef.current = true;
        }, STRICT_MODE_GUARD_MS);

        const startDwell = () => {
            if (dwellTimerRef.current !== null) return;
            dwellTimerRef.current = window.setTimeout(() => {
                dwellTimerRef.current = null;
                if (startedAtRef.current === null) {
                    const now = Date.now();
                    startedAtRef.current = new Date(now).toISOString();
                    lastActiveAtMsRef.current = now;
                    lastEngagedAtMsRef.current = now;
                }
            }, MIN_DWELL_MS);
        };

        const cancelDwell = () => {
            if (dwellTimerRef.current !== null) {
                clearTimeout(dwellTimerRef.current);
                dwellTimerRef.current = null;
            }
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    entry.intersectionRatio >= VISIBILITY_THRESHOLD
                ) {
                    isVisibleRef.current = true;
                    if (startedAtRef.current === null) {
                        startDwell();
                    }
                } else {
                    // Transitioning from visible to not-visible AFTER engagement
                    // started: record this moment as the last engaged time so
                    // finalize uses it instead of the eventual unmount time.
                    if (
                        isVisibleRef.current &&
                        startedAtRef.current !== null
                    ) {
                        lastEngagedAtMsRef.current = Date.now();
                    }
                    isVisibleRef.current = false;
                    cancelDwell();
                }
            },
            { threshold: VISIBILITY_THRESHOLD }
        );
        observer.observe(el);

        const markActive = () => {
            lastActiveAtMsRef.current = Date.now();
        };
        for (const evt of ACTIVITY_EVENTS) {
            window.addEventListener(evt, markActive, { passive: true });
        }

        tickerRef.current = window.setInterval(() => {
            if (startedAtRef.current === null) return;
            if (!isVisibleRef.current) return;
            const now = Date.now();
            const idleFor = now - lastActiveAtMsRef.current;
            if (idleFor > INACTIVITY_LIMIT_MS) return;
            activeDurationMsRef.current += TICK_INTERVAL_MS;
            // Keep last-engaged current while actively engaged so that even
            // if visibility loss is missed (e.g. tab close), finalize has a
            // recent timestamp instead of falling back to "now" later.
            lastEngagedAtMsRef.current = now;
        }, TICK_INTERVAL_MS);

        return () => {
            clearTimeout(mountGuardTimer);
            observer.disconnect();
            cancelDwell();
            if (tickerRef.current !== null) {
                clearInterval(tickerRef.current);
                tickerRef.current = null;
            }
            for (const evt of ACTIVITY_EVENTS) {
                window.removeEventListener(evt, markActive);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const child = isValidElement(children)
        ? cloneElement(children, {
              onInteraction: wrappedOnInteraction,
              onAttemptRetry: handleAttemptRetry,
          })
        : children;

    return <div ref={containerRef}>{child}</div>;
};

export default EngagementWrapper;
