import {BigNumber} from '@ethersproject/bignumber';
import {EIGHTEEN, TEN, ZERO} from './constants.js';

export function expandTo18Decimals(value, decimals) {
  const scalar = TEN.pow(EIGHTEEN.sub(decimals));
  return value.mul(scalar);
}

export function convertStringToBigNumber(
  input,
  inputDecimals,
  outputDecimals,
) {
  const LEADING_ZERO_REGEX = /^0+/;
  const adjustedStringValue = Number.parseFloat(input)
    .toFixed(outputDecimals - inputDecimals)
    .replace('.', '')
    .replace(LEADING_ZERO_REGEX, '');
  return adjustedStringValue.length === 0 ? ZERO : BigNumber.from(adjustedStringValue);
}
