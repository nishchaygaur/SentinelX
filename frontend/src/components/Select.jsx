import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Polished, accessible SentinelX Select component.
 * Replaces native <select> elements across the SOC dashboard with custom dark theme
 * styling, keyboard navigation, smooth scrolling, and title tooltips for long labels.
 */
export default function Select({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  ariaLabel,
  name,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listboxRef = useRef(null);
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;

  // Normalize options into { value, label, title, disabled }
  const normalizedOptions = options.map((opt) => {
    if (opt !== null && typeof opt === "object") {
      return {
        value: opt.value !== undefined ? opt.value : "",
        label: opt.label !== undefined ? opt.label : String(opt.value),
        title: opt.title || (typeof opt.label === "string" ? opt.label : String(opt.value)),
        disabled: Boolean(opt.disabled),
        icon: opt.icon,
      };
    }
    return {
      value: opt,
      label: String(opt),
      title: String(opt),
      disabled: false,
    };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const selectedIndex = normalizedOptions.findIndex(
    (opt) => String(opt.value) === String(value)
  );

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Keep highlighted index in sync when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const items = listboxRef.current.querySelectorAll(".sentinel-select-option");
      const currentItem = items[highlightedIndex];
      if (currentItem && currentItem.scrollIntoView) {
        currentItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  const handleSelect = (option) => {
    if (option.disabled || disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;

      case "Tab":
        setIsOpen(false);
        break;

      case "ArrowDown": {
        e.preventDefault();
        let nextIndex = highlightedIndex + 1;
        while (nextIndex < normalizedOptions.length && normalizedOptions[nextIndex].disabled) {
          nextIndex++;
        }
        if (nextIndex < normalizedOptions.length) {
          setHighlightedIndex(nextIndex);
        }
        break;
      }

      case "ArrowUp": {
        e.preventDefault();
        let prevIndex = highlightedIndex - 1;
        while (prevIndex >= 0 && normalizedOptions[prevIndex].disabled) {
          prevIndex--;
        }
        if (prevIndex >= 0) {
          setHighlightedIndex(prevIndex);
        }
        break;
      }

      case "Enter":
      case " ": {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          handleSelect(normalizedOptions[highlightedIndex]);
        }
        break;
      }

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`sentinel-select-container ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
    >
      <button
        id={selectId}
        type="button"
        className={`sentinel-select-trigger ${triggerClassName}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        title={selectedOption ? selectedOption.title : placeholder}
      >
        <span className="sentinel-select-value">
          {selectedOption ? (
            <span className="sentinel-select-label-text">
              {selectedOption.icon && (
                <span className="sentinel-select-option-icon">{selectedOption.icon}</span>
              )}
              {selectedOption.label}
            </span>
          ) : (
            <span className="sentinel-select-placeholder">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          size={14}
          className={`sentinel-select-chevron ${isOpen ? "rotate" : ""}`}
          aria-hidden="true"
        />
      </button>

      {name && <input type="hidden" name={name} value={value ?? ""} />}

      {isOpen && (
        <ul
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={selectId}
          className={`sentinel-select-menu ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <li className="sentinel-select-empty">No options available</li>
          ) : (
            normalizedOptions.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = highlightedIndex === index;

              return (
                <li
                  key={`${option.value}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  title={option.title}
                  className={`sentinel-select-option ${
                    isSelected ? "selected" : ""
                  } ${isHighlighted ? "highlighted" : ""} ${
                    option.disabled ? "disabled" : ""
                  }`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                >
                  <div className="sentinel-select-option-content">
                    {option.icon && (
                      <span className="sentinel-select-option-icon">{option.icon}</span>
                    )}
                    <span className="sentinel-select-option-label">{option.label}</span>
                  </div>

                  {isSelected && (
                    <Check size={13} className="sentinel-select-check" aria-hidden="true" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
