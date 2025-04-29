"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SearchableDropdown - A component that allows users to search and select from a dropdown
 * 
 * @param {Object} props
 * @param {string} props.value - The currently selected value
 * @param {string[]} props.options - Array of options to select from
 * @param {function} props.onChange - Function to call when selection changes
 * @param {string} props.placeholder - Placeholder text when no selection
 * @param {string} props.className - Additional CSS classes
 * @param {function} props.formatOption - Optional function to format display of options
 * @param {function} props.formatSelection - Optional function to format display of selected item
 */
interface SearchableDropdownProps {
  value: string;
  options: string[];
  onChange: (option: string) => void;
  placeholder?: string;
  className?: string;
  formatOption?: (option: string) => string;
  formatSelection?: (option: string) => string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "",
  formatOption = (option) => option,
  formatSelection = (option) => option
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !(dropdownRef.current as HTMLElement).contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle option selection
const handleSelect = (option: string): void => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
};

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        type="button"
        className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {value ? formatSelection(value) : placeholder}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Options list */}
          <ul className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={index}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${value === option ? 'bg-blue-100' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {formatOption(option)}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-gray-500">No options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;