"use client"

import { useState } from "react"
import { GasPriceOption, useAppStore } from "@/stores/app"
import { getGasPriceLabel, getGasPriceTimeEstimate } from "@/utils/gas"
import s from "./gas-price-selector.module.scss"
import clsx from "clsx"

export const GasPriceSelector = () => {
  const { gasPriceOption, setGasPriceOption, debugMode } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)

  // Only show in debug mode
  if (!debugMode) return null

  const options: GasPriceOption[] = ["low", "average", "fast"]

  const handleOptionSelect = (option: GasPriceOption) => {
    setGasPriceOption(option)
    setIsOpen(false)
  }

  return (
    <div className={s["gas-price-selector"]}>
      <div className={s["gas-price-selector__label"]}>Transaction Speed:</div>

      <div className={s["gas-price-selector__dropdown"]}>
        <button
          className={s["gas-price-selector__selected"]}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={s["gas-price-selector__option-label"]}>
            {getGasPriceLabel(gasPriceOption)}
          </span>
          <span className={s["gas-price-selector__arrow"]}>
            {isOpen ? "▲" : "▼"}
          </span>
        </button>

        {isOpen && (
          <ul
            className={s["gas-price-selector__options"]}
            role="listbox"
            aria-activedescendant={`gas-option-${gasPriceOption}`}
          >
            {options.map((option) => (
              <li
                key={option}
                id={`gas-option-${option}`}
                className={clsx(
                  s["gas-price-selector__option"],
                  option === gasPriceOption &&
                    s["gas-price-selector__option--selected"]
                )}
                role="option"
                aria-selected={option === gasPriceOption}
                onClick={() => handleOptionSelect(option)}
              >
                <div className={s["gas-price-selector__option-content"]}>
                  <span className={s["gas-price-selector__option-label"]}>
                    {getGasPriceLabel(option)}
                  </span>
                  <span className={s["gas-price-selector__option-description"]}>
                    {getGasPriceTimeEstimate(option)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default GasPriceSelector
