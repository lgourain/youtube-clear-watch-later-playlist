# Clear your YouTube Watch Later playlist

Script written in JavaScript for removing all videos from your YouTube Watch Later playlist.

## ✨ Features

- 🚀 Automated deletion of all videos from your Watch Later playlist
- 🔄 Automatic retry on API errors (409 Conflict, 400 Bad Request)
- 📊 Real-time statistics display
- ⏸️ Start/Stop controls
- 🔃 Lazy loading management
- 🎯 Works with deleted and private videos

## 🚀 Quick Start

### Step by step tutorial:

1. **Go to your YouTube Watch Later Playlist**: https://www.youtube.com/playlist?list=WL

2. **Open the console**:

   - `Ctrl + Shift + I` (Windows/Linux)
   - `Cmd + Option + I` (Mac)
   - Or: `Right Click + Inspect`

3. **Copy and paste the script**:

   Copy the content of [`clear-watch-later.js`](./clear-watch-later.js)\*\*

   Open the file, copy its entire content, and paste it in the console tab.

4. **The script will automatically start** and display real-time statistics in the console.

## 🎮 Controls

Once the script is running, you can use these commands in the console:

- `stopCleaning()` - Stop the cleaning process
- `startCleaning()` - Restart the cleaning process

## 📋 Improvements over the basic version

The script now includes:

- **Error handling**: Automatic retry on API errors (409 Conflict, 400 Bad Request)
- **Retry logic**: Up to 3 attempts per video with 2-second delay between retries
- **Real-time statistics**: Track progress with deleted count, errors, and elapsed time
- **Lazy loading management**: Automatically scrolls to load more videos when needed
- **Better UX**: Clear visual feedback and control commands
- **Robustness**: Better error recovery and logging

## ⚠️ Known Issues

- **Empty list but playlist not empty**: If no more videos appear but the playlist counter shows remaining videos, reload the page and restart the script. This is due to YouTube's lazy loading mechanism.
- **API rate limiting**: YouTube may temporarily block deletions (400 error) to prevent spam. The script will retry automatically, but you may need to wait a few minutes if errors persist.
- **5000 video limit**: YouTube's Watch Later playlist is limited to 5000 videos maximum.

## 🤝 Contributing

Suggestions and improvements are welcome! Feel free to open an issue or submit a pull request.

## 📝 License

MIT

---

**Note**: This script only works on the Watch Later playlist page: https://www.youtube.com/playlist?list=WL
