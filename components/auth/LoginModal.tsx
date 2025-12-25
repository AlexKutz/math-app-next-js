'use client'

import { createPortal } from 'react-dom'
import { LoginForm } from './LoginForm'
import { BaseModal } from '../BaseModal'

type Props = {
  onClose: () => void
}

export const LoginModal = ({ onClose }: Props) => {
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <BaseModal onClose={onClose}>
      <LoginForm onSuccess={onClose} />
    </BaseModal>,
    document.body
  )
}
