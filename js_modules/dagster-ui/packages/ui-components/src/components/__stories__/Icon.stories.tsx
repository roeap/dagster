import {Meta} from '@storybook/react';
import * as React from 'react';

import {CoreColors} from '../../palettes/Colors';
import {Box} from '../Box';
import {IconNames as _iconNames, Icon} from '../Icon';
import {Tooltip} from '../Tooltip';

const IconNames = _iconNames.slice().sort();

// eslint-disable-next-line import/no-default-export
export default {
  title: 'Icon',
  component: Icon,
} as Meta;

export const Size16 = () => {
  return (
    <Box flex={{gap: 6, wrap: 'wrap'}}>
      {IconNames.map((name) => (
        <Tooltip content={name} key={name}>
          <Icon name={name} />
        </Tooltip>
      ))}
    </Box>
  );
};

export const Size24 = () => {
  return (
    <Box flex={{gap: 6, wrap: 'wrap'}}>
      {IconNames.map((name) => (
        <Tooltip content={name} key={name}>
          <Icon name={name} size={24} />
        </Tooltip>
      ))}
    </Box>
  );
};

export const IconColors = () => {
  const colorKeys = Object.keys(CoreColors);
  const numColors = colorKeys.length;
  const colorAtIndex = (index: number) => {
    const colorKey = colorKeys[index % numColors];
    if (colorKey) {
      const colorAtKey = CoreColors[colorKey as keyof typeof CoreColors];
      if (colorAtKey) {
        return colorAtKey;
      }
    }
    return CoreColors.Gray100;
  };

  return (
    <Box flex={{gap: 6, wrap: 'wrap'}}>
      {IconNames.map((name, idx) => (
        <Tooltip content={name} key={name}>
          <Icon name={name} color={colorAtIndex(idx)} size={24} />
        </Tooltip>
      ))}
    </Box>
  );
};
