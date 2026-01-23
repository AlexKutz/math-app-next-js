'use client';

import { TMultipleChoiceTask } from '@/types/task';
import { TInputTask } from '@/types/task';
import { MultipleChoiceTask } from './MultipleChoiceTask';
import { useState, useEffect, useRef, useMemo } from 'react';
import { InputTask } from './InputTask';
import { useSession } from 'next-auth/react';
import { TaskSubmissionResponse, UserTopicXP, TopicXPConfig } from '@/types/xp';
import { GETXpUserResponse as UserXPResponse } from '@/types/xp';

export const Tasks = ({
  tasks,
  topicSlug,
}: {
  tasks: (TMultipleChoiceTask | TInputTask)[];
  topicSlug: string;
}) => {
  const { data: session } = useSession();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [taskAnswers, setTaskAnswers] = useState<{ [key: string]: any }>({});
  const [submissionResults, setSubmissionResults] = useState<{
    [key: string]: TaskSubmissionResponse;
  }>({});
  const [userXP, setUserXP] = useState<UserTopicXP | null>(null);
  const [topicConfig, setTopicConfig] = useState<TopicXPConfig | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTasksLoaded, setIsTasksLoaded] = useState(false);

  const correctAnswerSoundRef = useRef<HTMLAudioElement | null>(null);
  const incorrectAnswerSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    correctAnswerSoundRef.current = new Audio('/sounds/correctChoice.mp3');
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserXP();
    }
  }, [session, topicSlug]);

  const fetchUserXP = async () => {
    try {
      const response = await fetch(`/api/xp/user?topicSlug=${topicSlug}`)
      if (response.ok) {
        const data: UserXPResponse = await response.json();
        setUserXP(data.userXP);
        setTopicConfig(data.topicConfig);
        if (data.completedTaskIds) {
          setCompletedTaskIds(new Set(data.completedTaskIds));
        }
        setIsTasksLoaded(true);
      }
    } catch (error) {
      console.error('Failed to fetch user XP');
    }
  };

  const handleTaskSubmit = async (taskId: string, answer: any) => {
    if (!session?.user) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const task = tasks.find((t) => t.id === taskId);
      let isCorrect = false;

      // Перевіряємо правильність відповіді
      if (task?.type === 'multiple-choice') {
        isCorrect = task.answer === answer;
      } else if (task?.type === 'input') {
        isCorrect = task.correct === answer;
      }

      if (isCorrect) {
        correctAnswerSoundRef.current?.play();
      }

      const response = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          topicSlug,
          isCorrect,
          userAnswer: answer,
          baseXP: task?.baseXP,
          difficulty: task?.difficulty,
        }),
      });

      const result: TaskSubmissionResponse = await response.json();

      setSubmissionResults((prev) => ({ ...prev, [taskId]: result }));

      if (result.success && result.userXP) {
        setUserXP(result.userXP);
        // Додаємо задачу до списку виконаних, якщо вона була виконана правильно
        if (isCorrect) {
          setCompletedTaskIds((prev) => new Set(prev).add(taskId));
          // Не збільшуємо індекс, якщо задача видаляється зі списку доступних,
          // бо наступна задача сама "стане" на поточний індекс.
          // Якщо це була остання задача, currentTaskIndex автоматично вкаже на поза межі,
          // що ми обробимо в рендері.
        } else {
          setCurrentTaskIndex((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const availableTasks = useMemo(() => {
    return tasks.filter((task) => !completedTaskIds.has(task.id));
  }, [tasks, completedTaskIds]);
  
  const currentTask = availableTasks[currentTaskIndex];
  const currentResult = submissionResults[currentTask?.id];

  const setTaskAnswer = (taskId: string, answer: any) => {
    setTaskAnswers((prev) => ({
      ...prev,
      [taskId]: answer,
    }));
  };

  if (!isTasksLoaded) {
    return <div></div>
    //TODO: Add loader
  }

  const isNextTaskAvailable = currentTaskIndex < availableTasks.length - 1;

  if (availableTasks.length === 0) {
    return (
      <div className='rounded-lg border bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900'>
        <div className='mb-4 text-5xl'>🎉</div>
        <h2 className='mb-2 text-2xl font-bold'>Всі завдання виконано!</h2>
        <p className='text-gray-600 dark:text-gray-400'>
          Ви успішно пройшли всі доступні вправи з цієї теми.
        </p>
        {userXP?.nextReviewDate && (
          <div className='mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20'>
            <p className='text-sm text-blue-800 dark:text-blue-200'>
              Наступне планове повторення:{' '}
              <span className='font-bold'>
                {new Date(userXP.nextReviewDate).toLocaleDateString('uk-UA')}
              </span>
            </p>
            <p className='mt-1 text-xs text-blue-600 dark:text-blue-300'>
              Повертайтеся тоді, щоб отримати максимальний досвід та закріпити знання.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!currentTask) {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex(0);
    }
    return <div>Завантаження...</div>;
  }

  let CurrentTaskComponent;

  switch (currentTask.type) {
    case 'multiple-choice':
      CurrentTaskComponent = (
        <MultipleChoiceTask
          task={currentTask}
          setAnswer={(taskId, answer) => handleTaskSubmit(taskId, answer)}
        />
      );
      break;
      //FIXME: InputTask always wrong
    case 'input':
      CurrentTaskComponent = (
        <InputTask
          task={currentTask}
          setAnswer={(taskId, answer) => handleTaskSubmit(taskId, answer)}
        />
      );
      break;
    default:
      return <div>Unknown task type</div>;
  }

  return (
    <>
      {/* Відображення досвіду користувача */}
      {userXP && (
        <div
          className={`mb-6 rounded-lg border p-4 shadow-sm ${
            userXP.nextReviewDate &&
            new Date(userXP.nextReviewDate) <= new Date()
              ? 'bg-linear-to-r from-amber-50 to-yellow-50 ring-2 ring-amber-400 dark:from-amber-900/20 dark:to-yellow-900/20 dark:ring-amber-600'
              : 'bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20'
          }`}
        >
          <div className='mb-2 flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Досвід</h3>
            <div className='flex items-center gap-2'>
              {userXP.nextReviewDate &&
                new Date(userXP.nextReviewDate) <= new Date() && (
                  <span className='rounded-full bg-amber-400 px-2 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-600 dark:text-amber-100'>
                    🔥 Гаряча тема
                  </span>
                )}
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Рівень {userXP.level}
              </div>
            </div>
          </div>
          <div className='mb-2'>
            <div className='mb-1 flex justify-between text-sm'>
              <span>{userXP.currentXp} XP</span>
              <span>
                {typeof userXP.nextLevelXp === 'number'
                  ? `${userXP.nextLevelXp} XP`
                  : 'MAX'}
              </span>
            </div>
            <div className='h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
              <div
                className='h-2.5 rounded-full bg-linear-to-r from-blue-600 to-purple-600 transition-all duration-500'
                style={{
                  width:
                    typeof userXP.nextLevelXp === 'number' &&
                    typeof userXP.currentLevelMinXp === 'number'
                      ? `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((userXP.currentXp - userXP.currentLevelMinXp) /
                              (userXP.nextLevelXp - userXP.currentLevelMinXp)) *
                              100,
                          ),
                        )}%`
                      : '100%',
                }}
              />
            </div>
          </div>
          {/* Батарейка енергії теми */}
          {topicConfig && (
            <div className='mb-2'>
              <div className='mb-1 flex items-center justify-between text-xs'>
                <span className='text-gray-600 dark:text-gray-400'>
                  Енергія теми
                </span>
                <span className='font-medium'>
                  {(() => {
                    const today = new Date().toISOString().slice(0, 10);
                    const lastDate = userXP.dailyTasksDate
                      ? new Date(userXP.dailyTasksDate).toISOString().slice(0, 10)
                      : null;
                    const isNewDay = lastDate !== today;
                    const isHotTopic =
                      !userXP.nextReviewDate ||
                      new Date(userXP.nextReviewDate).toISOString().slice(0, 10) <=
                        today;
                    const dailyCount = isNewDay || isHotTopic ? 0 : userXP.dailyTasksCount;
                    const fullTasksRemaining = Math.max(
                      0,
                      topicConfig.dailyFullTasks - dailyCount,
                    );
                    const halfTasksRemaining = Math.max(
                      0,
                      topicConfig.dailyFullTasks +
                        topicConfig.dailyHalfTasks -
                        dailyCount,
                    );

                    console.log('fullTasksRemaining', fullTasksRemaining, 'halfTasksRemaining', halfTasksRemaining, 'dailyCount', dailyCount);

                    if (isHotTopic && !isNewDay && dailyCount === 0) {
                      return 'Повна енергія 🔋';
                    }
                    if (fullTasksRemaining > 0) {
                      return `${fullTasksRemaining} задач з повним XP`;
                    }
                    if (halfTasksRemaining > 0) {
                      return `${halfTasksRemaining} задач з 50% XP`;
                    }
                    return 'Енергія вичерпана ⚡';
                  })()}
                </span>
              </div>
              <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (() => {
                      const today = new Date().toISOString().slice(0, 10);
                      const lastDate = userXP.dailyTasksDate
                        ? new Date(userXP.dailyTasksDate).toISOString().slice(0, 10)
                        : null;
                      const isNewDay = lastDate !== today;
                      const isHotTopic =
                        !userXP.nextReviewDate ||
                        new Date(userXP.nextReviewDate).toISOString().slice(0, 10) <=
                          today;
                      const dailyCount =
                        isNewDay || isHotTopic ? 0 : userXP.dailyTasksCount;
                      const totalAvailable =
                        topicConfig.dailyFullTasks + topicConfig.dailyHalfTasks;
                      const remaining = Math.max(0, totalAvailable - dailyCount);
                      const percent = (remaining / totalAvailable) * 100;
                      if (percent > 66) return 'bg-green-500';
                      if (percent > 33) return 'bg-yellow-500';
                      return 'bg-red-500';
                    })()
                  }`}
                  style={{
                    width: `${(() => {
                      const today = new Date().toISOString().slice(0, 10);
                      const lastDate = userXP.dailyTasksDate
                        ? new Date(userXP.dailyTasksDate).toISOString().slice(0, 10)
                        : null;
                      const isNewDay = lastDate !== today;
                      const isHotTopic =
                        !userXP.nextReviewDate ||
                        new Date(userXP.nextReviewDate).toISOString().slice(0, 10) <=
                          today;
                      const dailyCount =
                        isNewDay || isHotTopic ? 0 : userXP.dailyTasksCount;
                      const totalAvailable =
                        topicConfig.dailyFullTasks + topicConfig.dailyHalfTasks;
                      const remaining = Math.max(0, totalAvailable - dailyCount);
                      return Math.min(100, (remaining / totalAvailable) * 100);
                    })()}%`,
                  }}
                />
              </div>
            </div>
          )}
          {/* Таймер до відновлення */}
          {userXP.nextReviewDate &&
            new Date(userXP.nextReviewDate) > new Date() && (
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                До відновлення повного досвіду:{' '}
                {(() => {
                  const now = new Date();
                  const nextDate = new Date(userXP.nextReviewDate!);
                  const diffMs = nextDate.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) return 'завтра';
                  if (diffDays <= 7) return `через ${diffDays} дні`;
                  return nextDate.toLocaleDateString('uk-UA');
                })()}
              </p>
            )}
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            Всього зароблено: {userXP.totalXpEarned} XP
          </p>
        </div>
      )}

      {CurrentTaskComponent}

      {/* Результат відповіді */}
      {currentResult && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            currentResult.success
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}
        >
          <p className='font-medium'>{currentResult.message}</p>
          {currentResult.xpResult && (
            <div className='mt-2 space-y-1 text-sm'>
              {currentResult.xpResult.multiplier !== 1 && (
                <p className='text-xs'>
                  Множник XP: {Math.round(currentResult.xpResult.multiplier * 100)}%
                  {currentResult.xpResult.isTooEarly && ' (занадто рано для повторення)'}
                </p>
              )}
              {currentResult.xpResult.dailyTaskIndex && (
                <p className='text-xs'>
                  Задача #{currentResult.xpResult.dailyTaskIndex} сьогодні
                </p>
              )}
              {currentResult.xpResult.nextReviewDate && (
                <p>
                  Наступне повторення:{' '}
                  {new Date(
                    currentResult.xpResult.nextReviewDate,
                  ).toLocaleDateString('uk-UA')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {currentTaskIndex !== 0 && (
        <ChangeTaskButton
          label='Попереднє завдання'
          onNext={() => setCurrentTaskIndex((idx) => idx - 1)}
        />
      )}
      {isNextTaskAvailable && (
        <ChangeTaskButton
          label='Наступне завдання'
          onNext={() => setCurrentTaskIndex((idx) => idx + 1)}
        />
      )}
    </>
  );
};

const ChangeTaskButton = ({
  onNext,
  label,
}: {
  onNext: () => void;
  label: string;
}) => {
  return (
    <button
      onClick={onNext}
      className='mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
    >
      {label}
    </button>
  );
};
