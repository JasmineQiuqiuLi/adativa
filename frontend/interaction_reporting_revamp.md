# Interaction Tracking Revamp Design

# Markdown Rendering Optimization

## Problem

Currently, all content blocks are wrapped by `RenderMarkdown`.

This is unnecessary because many blocks do not contain markdown syntax requiring parsing (bold, italic, lists, etc.), and wrapping all blocks introduces unnecessary rendering overhead.

## Proposed Change

Only apply `RenderMarkdown` to blocks that actually require markdown parsing.

Apply to:

* `rich_content`
* `tabs`
* `accordion`

Do not wrap:

* `multiple_choice`
* `true_false`
* `match`
* `short_essay`
* `flashcard`
* `game`
* `scenario`
* other non-markdown blocks

---

# Interaction Reporting Design

## Overview

### Problem

Currently engagement is measured using component lifecycle:

```text
mount → started_at
unmount → engagement_end
```

This approach becomes problematic after moving to objective-level generation where 3–5 blocks can exist simultaneously.

Problems:

* Multiple blocks mount simultaneously
* Learners do not interact with all blocks equally
* Users may quickly scroll through blocks
* Users may leave tabs open without active engagement
* Users may revisit earlier blocks

This inflates engagement measurements and creates inaccurate interaction records.

---

## Design Principle

Separate:

```text
Content Engagement
        ↓
contains
        ↓
Attempt(s)
```

Definitions:

### Content Engagement

Represents:

> How long the learner actively engages with content

Responsible for:

* `started_at`
* `engagement_end`
* `active_duration`

Managed by:

```text
EngagementHook / EngagementWrapper
```

---

### Attempt

Represents:

> What the learner submitted

Responsible for:

* `attempt_number`
* `submitted_at`
* `response`
* `score`
* `is_correct`
* `metadata`

Managed by:

```text
MultipleChoice
TrueFalse
Match
ShortEssay
Game
...
```

---

# Data Ownership

Block components should never directly persist records.

Blocks emit interaction data upward.

The parent component assembles:

* `user_id`
* `content_id`
* `session_id`
* `content_type`

before storing records into:

```text
fact_interactions
```

Architecture:

```text
Block
    ↓
EngagementHook
    ↓
Parent
    ↓
Database
```

---

# Reported Fields by Block Type

| Field            | Non-Graded | Graded | Description                                                     |
| ---------------- | ---------: | -----: | --------------------------------------------------------------- |
| interaction_type |          ✅ |      ✅ | Type of interaction (`quiz_attempt`, `flashcard_session`, etc.) |
| started_at       |          ❌ |      ❌ | Moved to EngagementHook                                         |
| engagement_end   |          ❌ |      ❌ | Moved to EngagementHook                                         |
| active_duration  |          ❌ |      ❌ | Calculated by EngagementHook                                    |
| metadata         |          ✅ |      ✅ | Block-specific metadata                                         |
| submitted_at     |          ❌ |      ✅ | Timestamp of submission                                         |
| response         |          ❌ |      ✅ | Submitted response                                              |
| is_correct       |          ❌ |      ✅ | Correctness result                                              |
| score            |          ❌ |      ✅ | Earned score                                                    |
| attempt_number   |          ❌ |      ✅ | Attempt count                                                   |

---

# Refactor Requirement

Remove block-level reporting for:

```text
started_at
engagement_end
active_duration
```

Move responsibility entirely into:

```text
EngagementHook / EngagementWrapper
```

Keep remaining interaction data reported from blocks.

---

# onInteraction Contract

Blocks continue reporting through:

```tsx
onInteraction(payload)
```

Example:

```typescript
onInteraction({

    interaction_type,

    submitted_at,

    response,

    score,

    is_correct,

    attempt_number,

    metadata

})
```

The parent component merges:

```text
engagement fields
+
system fields
+
block payload
```

before persisting.

---

# Hook / Wrapper Responsibilities

## started_at

Set when:

* component becomes visible
* visibility threshold is satisfied

Example:

```text
IntersectionObserver threshold = 50%
```

Notes:

* `started_at` represents beginning of engagement
* initial attempt uses same `started_at`

---

## engagement_end

Set when:

* component leaves viewport
* learner navigates away
* inactivity threshold exceeded
* browser closes

Notes:

* temporary visibility loss pauses engagement
* temporary visibility loss does NOT create a new session
* if learner returns later:

  * `engagement_end` updates
  * `active_duration` continues accumulating

---

## active_duration

Definition:

```text
active_duration accumulates while:

component visible
AND
user active
AND
inactivity threshold not exceeded
```

Notes:

```text
active_duration
≠
engagement_end - started_at
```

because:

* tabs may remain open
* learners may become idle
* users may leave and return

---

## Inactivity

Example:

```text
INACTIVITY_LIMIT = 30 seconds
```

Activity events:

* click
* keyboard
* submit
* retry
* scroll
* touch

If threshold exceeded:

```text
pause active_duration accumulation
```

---

## Ignore Quick Scroll Behavior

Example:

```text
MIN_DURATION = 3 seconds
```

If:

```text
active_duration < MIN_DURATION
```

Then:

```text
ignore interaction record
```

---

# Database Write Strategy

Use immediate save + later update.

Step 1:

```text
submit
↓
save immediately
```

Step 2:

```text
engagement_end determined later
↓
update engagement fields
```

Advantages:

* avoids data loss
* avoids waiting until objective completion
* engagement information can evolve

---

# Browser Close Handling

If browser closes:

```text
window close
or
component unmount
```

For records without `engagement_end`:

```text
engagement_end = close timestamp
```

---

# Attempt Rules

## Attempt Numbering

Normal attempts:

```text
1
2
3
...
```

Special cases:

```text
attempt_number = 0
```

Used for:

* skipped
* abandoned

---

## Maximum Attempts

Infinite attempts are not allowed.

Attempts are controlled by:

```text
max_attempts
```

defined in content configuration.

---

## Attempt Start Rules

### Attempt 1

Starts when:

```text
component becomes visible
```

Rule:

```text
attempt.started_at
=
content.started_at
```

---

### Attempt N

Starts when:

```text
retry clicked
```

---

### Attempt End

Ends when:

```text
submit clicked
```

Stores:

```text
submitted_at
```

---

# Submission Rules

## Submit Without Modification

Scenario:

```text
Attempt1
↓
submit

↓

retry

↓

submit immediately
```

Rule:

```text
Record both attempts
```

No duplicate filtering.

---

## Multiple Answer Changes Before Submit

Scenario:

```text
B
↓
C
↓
A
↓
D
↓
submit
```

Current behavior:

Store final response only:

```json
{
   "response":"D"
}
```

Optional:

Selection history may be stored inside metadata:

```json
{
   "metadata":{
      "selection_history":[
         "B",
         "C",
         "A",
         "D"
      ]
   }
}
```

---

# Scenario Logic

## Scenario 1: Single Attempt

```text
Visible
↓
started_at
↓
Select answer
↓
Submit
↓
Leave
↓
engagement_end
```

---

## Scenario 2: Multiple Attempts

```text
Visible
↓
started_at
↓
Submit Attempt1
↓
Retry
↓
Submit Attempt2
↓
...
↓
Leave
↓
engagement_end
```

---

## Scenario 3: Skip

```text
Visible
↓
started_at
↓
click skip
↓
leave
↓
engagement_end
```

Record:

```json
{
    "attempt_number":0,
    "status":"skipped"
}
```

---

## Scenario 4: Abandon

```text
Visible
↓
started_at
↓
interact
↓
no submit
↓
leave
↓
engagement_end
```

Record:

```json
{
    "attempt_number":0,
    "status":"abandoned"
}
```

---

## Scenario 5: Last Attempt Abandoned

```text
Attempt1 submit
↓
Attempt2 submit
↓
retry
↓
Attempt3 starts
↓
leave without submit
```

Record:

```json
[
    {
        "attempt_number":1
    },
    {
        "attempt_number":2
    },
    {
        "attempt_number":0,
        "status":"abandoned"
    }
]
```

---

# Refactor Steps

1. Create `EngagementHook` / `EngagementWrapper`

2. Remove:

```text
started_at
engagement_end
active_duration
```

from block-level reporting

3. Keep block reporting through:

```tsx
onInteraction()
```

4. Parent merges:

```text
engagement fields
+
system fields
+
block payload
```

5. Store into:

```text
fact_interactions
```

---

# Final Event Flow

```text
Component visible
↓
Hook starts engagement

↓

User action

├── submit
│      ↓
│   save attempt
│
├── retry
│      ↓
│   create attempt
│
├── skip
│      ↓
│   attempt_number=0
│
└── abandon
       ↓
   attempt_number=0

↓

Hook tracks:

- visibility
- inactivity
- browser close

↓

engagement_end updated

↓

Parent assembles complete record

↓

save/update fact_interactions
```
