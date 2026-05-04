# Storybook for React Native - GPS Test App

Storybook er nu installeret i GPS Test appen. Du kan bruge det til at udvikle og teste UI komponenter isoleret.

## 🚀 Sådan bruger du Storybook

### 1. Generer stories liste
Når du opretter nye `.stories.tsx` filer, skal du regenerere listen:

```bash
npm run storybook:generate
```

### 2. Start Storybook mode

For at se Storybook i appen, skal du:

1. Åbn `App.js`
2. Ændr `const SHOW_STORYBOOK = false;` til `const SHOW_STORYBOOK = true;`
3. Start appen:

```bash
npm start
```

### 3. Tilbage til normal app

Ændr bare `SHOW_STORYBOOK` tilbage til `false` i `App.js`

## 📝 Opret en ny story

### 1. Opret en komponent

```tsx
// src/components/MyButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export interface MyButtonProps {
  title: string;
  onPress?: () => void;
}

export const MyButton: React.FC<MyButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

### 2. Opret en story fil

```tsx
// src/components/MyButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-native';
import { MyButton } from './MyButton';
import { View } from 'react-native';

const meta = {
  title: 'Components/MyButton',
  component: MyButton,
  argTypes: {
    onPress: { action: 'pressed' },
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Click Me',
  },
};

export const LongText: Story = {
  args: {
    title: 'This is a button with very long text',
  },
};
```

### 3. Generer stories liste

```bash
npm run storybook:generate
```

## 📁 Story fil placering

Stories skal placeres ved siden af komponenten:

```
src/
  components/
    Button.tsx
    Button.stories.tsx
    MyComponent.tsx
    MyComponent.stories.tsx
```

## 🎨 Eksempel komponenter

Der er allerede oprettet en eksempel Button komponent med stories:

- `src/components/Button.tsx`
- `src/components/Button.stories.tsx`

Start Storybook mode for at se den!

## 📚 Addons inkluderet

- **Controls**: Ændr props i realtid
- **Actions**: Se events der fyres fra komponenter

## 🔧 Konfiguration

### Storybook config
`.rnstorybook/main.js` - Hovedkonfiguration
`.rnstorybook/Storybook.tsx` - Entry point

### Metro config
`metro.config.js` - Konfigureret til at understøtte Storybook

### Package.json scripts
- `npm run storybook:generate` - Generer stories liste
- `npm run storybook` - Generer og start app

## 💡 Tips

1. **Auto-generate**: Kør `npm run storybook:generate` efter du opretter nye stories
2. **Hot reload**: Stories hot-reloader automatisk når du redigerer dem
3. **Controls addon**: Brug controls til at teste forskellige props værdier
4. **Actions addon**: Se console logs for events som button presses

## 📖 Læs mere

- [Storybook for React Native docs](https://storybook.js.org/docs/react-native)
- [Writing Stories](https://storybook.js.org/docs/writing-stories)
- [Addons](https://storybook.js.org/docs/essentials/controls)
