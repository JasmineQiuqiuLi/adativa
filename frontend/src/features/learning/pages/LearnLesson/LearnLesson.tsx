import React from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import LessonNavigation from '../../components/LessonNavigation/LessonNavigation'
import LearnView from '../../components/LearnView/LearnView'
import Chat from '../../components/Chat/Chat'
import "./LeaarnLesson.css"

const LearnLesson = () => {
  return (
    <div className="learn-layout">
      <LessonNavigation />
      <LearnView />
      <Chat />
    </div>
  );
};

export default LearnLesson;

