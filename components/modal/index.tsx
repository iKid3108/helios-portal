"use client"

import clsx from "clsx"
import { ReactNode, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "../button"
import s from "./modal.module.scss"

interface ModalProps {
  onClose: () => void
  children: ReactNode
  className?: string
  title?: string
  full?: boolean
  open: boolean
  closeButton?: boolean
  responsiveBottom?: boolean
}

export function Modal({
  onClose,
  children,
  className,
  title,
  full,
  open,
  responsiveBottom,
  closeButton = true
}: ModalProps) {
  const modalRootRef = useRef<Element | null>(null)

  useEffect(() => {
    modalRootRef.current = document.getElementById("modal-root")
  }, [])

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow")
    } else {
      document.body.classList.remove("overflow")
    }

    return () => {
      document.body.classList.remove("overflow")
    }
  }, [open])

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [open, onClose])

  const handleClose = () => {
    onClose()
  }

  const isBrowser = typeof window !== "undefined"

  if (!isBrowser || !open) {
    return null
  }

  if (!modalRootRef.current) {
    modalRootRef.current = document.getElementById("modal-root")
    if (!modalRootRef.current) return null
  }

  return createPortal(
    <div
      className={clsx(
        s.overlay,
        full && s.overlayFull,
        responsiveBottom && s.responsiveBottom
      )}
      onClick={(e) => {
        // Only close if clicking directly on the overlay
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <div
        className={clsx(s.modal, className, full && s.full)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {closeButton && (
          <Button
            icon="mdi:close"
            onClick={handleClose}
            variant="secondary"
            size="xsmall"
            border
            className={s.close}
          />
        )}
        {title && (
          <h2 id="modal-title" className={s.title}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    modalRootRef.current
  )
}
