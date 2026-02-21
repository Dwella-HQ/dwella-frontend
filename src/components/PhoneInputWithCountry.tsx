"use client";

import * as React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export type PhoneInputWithCountryProps = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * Phone input with country code dropdown. Default country is Nigeria (+234).
 * Value is in E.164 format (e.g. +2348012345678).
 */
export const PhoneInputWithCountry = React.forwardRef<
  HTMLInputElement,
  PhoneInputWithCountryProps
>(function PhoneInputWithCountry(
  {
    value,
    onChange,
    id,
    placeholder = "801 234 5678",
    disabled,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedby,
    className,
  },
  _ref
) {
  return (
    <PhoneInput
      id={id}
      international
      defaultCountry="NG"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`PhoneInput--tailwind flex h-11 items-center rounded-lg border border-gray-300 bg-white overflow-hidden ${className ?? ""}`}
      numberInputProps={{
        "aria-invalid": ariaInvalid,
        "aria-describedby": ariaDescribedby,
        className:
          "h-11 flex-1 min-w-0 border-0 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0",
      }}
      countrySelectProps={{
        className:
          "h-11 border-0 bg-gray-50 pl-3 pr-8 text-sm text-gray-900 focus:outline-none focus:ring-0",
      }}
    />
  );
});
