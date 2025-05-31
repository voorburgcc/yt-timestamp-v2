chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveContent') {
    // Get extension directory path
    const extensionPath = chrome.runtime.getURL('');
    const filename = request.isBackup ? request.filename : 'timestamps.txt';
    
    // Use FileSystem API to write to extension directory
    window.webkitRequestFileSystem(window.PERSISTENT, 1024*1024, (fs) => {
      fs.root.getFile(filename, {create: true}, (fileEntry) => {
        fileEntry.createWriter((fileWriter) => {
          const blob = new Blob([request.content], {type: 'text/plain'});
          fileWriter.write(blob);
          sendResponse({success: true});
        });
      });
    });
    return true;
  }
});
