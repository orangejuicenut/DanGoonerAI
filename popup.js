// popup.js - Handles the extension popup interface

document.addEventListener('DOMContentLoaded', function() {
  const extractBtn = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  const tagPreview = document.getElementById('tagPreview');
  
  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Hide status after 3 seconds
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
  
  function showTagPreview(tagString, tagCount) {
    tagPreview.innerHTML = `
      <strong>Extracted <span class="tag-count">${tagCount}</span> tags:</strong><br><br>
      ${tagString}
    `;
    tagPreview.classList.add('show');
  }
  
  extractBtn.addEventListener('click', async function() {
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';
    
    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      
      // Check if we're on a Danbooru page
      if (!tab.url || !tab.url.includes('danbooru.donmai.us/posts/')) {
        showStatus('Please navigate to a Danbooru post page first', 'error');
        return;
      }
      
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {action: 'extractTags'});
      
      if (response.success) {
        const tagCount = response.formatted.length;
        showStatus(`Successfully copied ${tagCount} tags to clipboard!`, 'success');
        showTagPreview(response.tagString, tagCount);
        
        // Store the tags for potential reuse
        chrome.storage.local.set({
          lastExtractedTags: response.tagString,
          extractedAt: Date.now()
        });
      } else {
        showStatus(`Error: ${response.error}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('Could not establish connection')) {
        showStatus('Please refresh the Danbooru page and try again', 'error');
      } else {
        showStatus('An unexpected error occurred', 'error');
      }
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = 'Extract & Copy Tags';
    }
  });
  
  // Load and display last extracted tags if available
  chrome.storage.local.get(['lastExtractedTags', 'extractedAt'], function(result) {
    if (result.lastExtractedTags && result.extractedAt) {
      const timeDiff = Date.now() - result.extractedAt;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Show last tags if extracted within the last 24 hours
      if (hoursDiff < 24) {
        const tagCount = result.lastExtractedTags.split(', ').length;
        tagPreview.innerHTML = `
          <strong>Last extracted <span class="tag-count">${tagCount}</span> tags:</strong><br>
          <small>(${Math.round(hoursDiff)}h ago)</small><br><br>
          ${result.lastExtractedTags}
        `;
        tagPreview.classList.add('show');
      }
    }
  });
});