'use client'

import { LoginForm } from './LoginForm'
import { Modal } from '../Modal'

type Props = {
  onClose: () => void
}

export const LoginModal = ({ onClose }: Props) => {
  return (
    <Modal onClose={onClose} title="" align='start'>
      <LoginForm onSuccess={onClose} />
    </Modal>
  )
}
