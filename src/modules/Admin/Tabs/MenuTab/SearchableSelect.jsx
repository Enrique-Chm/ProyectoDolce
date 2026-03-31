// Archivo: src/modules/Admin/Tabs/SearchableSelect.jsx
import React, { useState, useEffect, useRef } from "react";
import s from "../../../../assets/styles/EstilosGenerales.module.css";

/**
 * SearchableSelect Homologado y Corregido
 */
export const SearchableSelect = ({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Buscar...",
  valueKey = "id",
  labelKey = "nombre",
  formatLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Sincronizar el texto con el valor seleccionado
  useEffect(() => {
    const selected = options.find(
      (opt) => String(opt[valueKey]) === String(value),
    );
    setSearchTerm(selected ? selected[labelKey] : "");
  }, [value, options, valueKey, labelKey]);

  // Manejar cierre al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        const selected = options.find(
          (opt) => String(opt[valueKey]) === String(value),
        );
        setSearchTerm(selected ? selected[labelKey] : "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, options, valueKey, labelKey]);

  const filteredOptions = options.filter((opt) =>
    String(opt[labelKey] || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className={s.relative}
      ref={containerRef}
      style={{ position: "relative" }}
    >
      <input
        type="text"
        className={`${s.inputField} ${disabled ? s.inputDisabled : ""}`}
        value={searchTerm}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && !disabled && (
        <ul
          className={s.dropdownList}
          style={{
            position: "absolute",
            zIndex: 1000,
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #ddd",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: 0,
            margin: "4px 0 0 0",
            listStyle: "none",
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, index) => (
              <li
                key={index}
                className={s.dropdownItem}
                style={{ padding: "8px 12px", cursor: "pointer" }}
                onMouseDown={(e) => {
                  e.preventDefault(); // Previene el blur del input antes del clic
                  onChange(opt[valueKey]);
                  setSearchTerm(opt[labelKey]);
                  setIsOpen(false);
                }}
              >
                {formatLabel ? formatLabel(opt) : opt[labelKey]}
              </li>
            ))
          ) : (
            <li
              className={s.dropdownItemMuted}
              style={{ padding: "8px 12px", color: "#999" }}
            >
              Sin resultados...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};