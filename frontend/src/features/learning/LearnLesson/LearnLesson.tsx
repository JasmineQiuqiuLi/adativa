import React from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

const LearnLesson = () => {
  const {lessonId}=useParams()

  return (
    <div>
      {lessonId}
    </div>
  )
}

export default LearnLesson
