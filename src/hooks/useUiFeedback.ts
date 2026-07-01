import { useContext } from 'react';
import { UiFeedbackContext } from '../contexts/UiFeedbackContext';

export const useUiFeedback = () => useContext(UiFeedbackContext);
