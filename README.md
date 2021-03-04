# Clear your YouTube Watch Later playlist

Script written in Javascript for removing all videos from your Youtube watch later playlist.

Step by step tutorial :

1. Go to your YouTube Watch Later Playlist : https://www.youtube.com/playlist?list=WL

2. Open the console :

* `Ctrl + Maj + I`
* Or : `Right Click + Inspect`

3. Copy and paste this code in the console tab :

```javascript
const interval = window.setInterval(() => {
  const dropdownButton = document.querySelector('#contents .dropdown-trigger.style-scope.ytd-menu-renderer');
  dropdownButton.click();
  let nbItems = document.querySelector('#items.ytd-menu-popup-renderer').childElementCount;
  if (nbItems > 1) {
  	nbItems = 3;
  }
  const deleteButton = document.querySelector(`#items.ytd-menu-popup-renderer :nth-child(${nbItems})`);
  deleteButton.click();
}, 100);
```

This will automatically start to remove all the videos from the watch later playlist, even the ones that are deleted or private.

4. Some issues may occur :

- No more videos in the list even if the playlist is not empty : just reload the page and restart the script above.
- For performance issues, you can cut the script by pasting this code in the console :

```javascript
clearInterval(interval)
```

I am open to any suggestion for improving this script.

Thanks
