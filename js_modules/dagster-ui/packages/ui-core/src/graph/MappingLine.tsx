import * as React from 'react';

import {Edge} from './OpEdges';
import {IPoint, isHighlighted} from './common';

interface MappingLineProps {
  source: IPoint;
  target: IPoint;
  leftEdgeX: number;
  minified: boolean;
  edge: Edge;

  highlightedEdges: Edge[];
  onHighlightEdges: (edges: Edge[]) => void;
}
export const MappingLine = ({
  source,
  target,
  minified,
  leftEdgeX,
  edge,
  highlightedEdges,
  onHighlightEdges,
}: MappingLineProps) => {
  const highlighted = isHighlighted(highlightedEdges, edge);

  return (
    <g onMouseEnter={() => onHighlightEdges([edge])} onMouseLeave={() => onHighlightEdges([])}>
      <path
        d={`M ${source.x} ${source.y} H ${leftEdgeX} V ${target.y} H ${target.x}`}
        fill="none"
        strokeWidth={minified ? 6 : 5}
        strokeLinecap="round"
        stroke={highlighted ? 'black' : 'rgb(137, 206, 206)'}
      />
      <path
        d={`M ${source.x} ${source.y} H ${leftEdgeX} V ${target.y} H ${target.x}`}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        stroke="white"
      />
    </g>
  );
};
