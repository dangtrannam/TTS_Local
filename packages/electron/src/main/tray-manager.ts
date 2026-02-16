import { app, Tray, Menu, type BrowserWindow, nativeImage } from 'electron';

let tray: Tray | null = null;

/**
 * Create system tray icon with context menu
 * @param mainWindow - Main browser window to show/hide
 */
export function createTray(mainWindow: BrowserWindow): void {
  // Create a simple tray icon programmatically
  // This creates a basic 16x16 icon with TTS text
  const iconDataURL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA' +
    'bwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAD5SURBVDiNpZIxS8NQFIW/l' +
    '5cmlSL+AEFwcxEHQdDBycXBRRDcHPwJ/gAHF0EQnBxcBEHBRRAEwcVBcHERBEFwcBFE0DbvOQ5tTZo0RQ9ceLy8+' +
    '7h5971LSATcBl6ANWBxmJ0DV8AzUAZqQANIgdN+fAw0gRrQBg6AySH9BnALpMBJ/xkJKAAFoBg4FoE88AzMAWlgC' +
    'ygCu0AJ2AE2gXVgBdgF9oEdYAPYBNaBFWAX2AM2gDVgGdgCtoE1YBlYAraBdWAZWAKWge1+fA1YBpaAJWB7qB8BY' +
    '8Ac8AHsA7PALPAB7AOzwBzwAewDs8Ac8AHsA3PAHPAB7P8P/gW+AWMTqMq8rHLPAAAAAElFTkSuQmCC';

  const icon = nativeImage.createFromDataURL(iconDataURL);

  tray = new Tray(icon);
  tray.setToolTip('TTS Local');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Show window when tray icon is clicked (macOS/Windows behavior)
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * Destroy system tray icon
 */
export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

/**
 * Update tray tooltip
 * @param text - New tooltip text
 */
export function updateTrayTooltip(text: string): void {
  if (tray) {
    tray.setToolTip(text);
  }
}
