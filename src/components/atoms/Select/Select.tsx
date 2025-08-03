import React from 'react';
import { Select as RadixSelect } from 'radix-ui';
import './Select.scss';
import chevronDownIcon from '@/assets/icons/chevron-down.svg';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
}) => {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger className={`select-trigger ${className}`.trim()}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="select-icon">
          <img src={chevronDownIcon} alt="" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="select-content"
          position="popper"
          side="bottom"
          align="start"
          avoidCollisions={false}
          sticky="always"
        >
          <RadixSelect.Viewport className="select-viewport">
            {options.map(option => (
              <RadixSelect.Item key={option.value} value={option.value} className="select-item">
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
};

export default Select;
