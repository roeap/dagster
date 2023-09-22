import styled, {css} from 'styled-components';

interface Props {
  $expandedClickPx?: number;
  $showFocusOutline?: boolean;
}

export const UnstyledButton = styled.button<Props>`
  border: 0;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  text-align: start;
  transition:
    box-shadow 150ms,
    opacity 150ms;
  user-select: none;
  white-space: nowrap;

  ${({$expandedClickPx}) =>
    $expandedClickPx
      ? css`
          padding: ${$expandedClickPx}px;
          margin: -${$expandedClickPx}px;
        `
      : null}

  :focus,
  :active {
    outline: none;
    ${({$showFocusOutline}) =>
      $showFocusOutline ? `box-shadow: rgba(58, 151, 212, 0.6) 0 0 0 3px;` : null}
  }

  &:disabled {
    color: inherit;
    cursor: default;
    opacity: 0.6;
  }
`;
