import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// Сервис для работы с тестами
export const testService = {
  // Получить все опубликованные тесты
  async getPublishedTests() {
    const q = query(
      collection(db, 'tests'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },

  // Получить тест по ID
  async getTest(testId: string) {
    const docRef = doc(db, 'tests', testId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  },

  // Создать новый тест
  async createTest(testData: Omit<Test, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, 'tests'), {
      ...testData,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  },

  // Получить вопросы теста
  async getTestQuestions(testId: string) {
    const q = query(
      collection(db, 'questions'),
      where('testId', '==', testId),
      orderBy('order')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  },
}

// Сервис для работы с попытками тестирования
export const attemptService = {
  async startTestAttempt(testId: string, userId: string) {
    const attemptData = {
      testId,
      userId,
      startedAt: serverTimestamp(),
      answers: [],
      totalScore: 0,
      status: 'in-progress',
    }
    const docRef = await addDoc(collection(db, 'attempts'), attemptData)
    return docRef.id
  },

  async submitAnswer(attemptId: string, answer: any) {
    const attemptRef = doc(db, 'attempts', attemptId)
    const attemptSnap = await getDoc(attemptRef)

    if (!attemptSnap.exists()) throw new Error('Attempt not found')

    const attempt = attemptSnap.data()
    const updatedAnswers = [...attempt.answers, answer]

    await updateDoc(attemptRef, {
      answers: updatedAnswers,
      totalScore: updatedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0),
    })
  },

  async completeAttempt(attemptId: string) {
    const attemptRef = doc(db, 'attempts', attemptId)
    await updateDoc(attemptRef, {
      completedAt: serverTimestamp(),
      status: 'completed',
    })
  },
}
