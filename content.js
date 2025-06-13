// content.js - Extracts and formats Danbooru tags

function extractTags() {
  const tags = {
    artist: [],
    character: [],
    copyright: [],
    general: [],
    meta: []
  };

  // Extract tags from the tag list sidebar
  const tagSections = document.querySelectorAll('.tag-type-section');
  
  tagSections.forEach(section => {
    const sectionTitle = section.querySelector('h2')?.textContent?.toLowerCase();
    const tagLinks = section.querySelectorAll('a.search-tag');
    
    let tagType = 'general';
    if (sectionTitle?.includes('artist')) tagType = 'artist';
    else if (sectionTitle?.includes('character')) tagType = 'character';
    else if (sectionTitle?.includes('copyright')) tagType = 'copyright';
    else if (sectionTitle?.includes('meta')) tagType = 'meta';
    
    tagLinks.forEach(link => {
      const tagText = link.textContent.trim();
	  console.log(tagText)
      if (tagText && !tags[tagType].includes(tagText)) {
        tags[tagType].push(tagText);
      }
    });
  });

  // Fallback: Try alternative selectors if main method fails
  if (Object.values(tags).every(arr => arr.length === 0)) {
    // Try extracting from the general tag list
    const allTagLinks = document.querySelectorAll('.tag-type-0 a, .tag-type-1 a, .tag-type-3 a, .tag-type-4 a');
    allTagLinks.forEach(link => {
      const tagText = link.textContent.trim();
      if (tagText && tagText != '?') {
        const classList = link.classList;
        if (classList.contains('tag-type-1')) tags.artist.push(tagText);
        else if (classList.contains('tag-type-4')) tags.character.push(tagText);
        else if (classList.contains('tag-type-3')) tags.copyright.push(tagText);
        else tags.general.push(tagText);
      }
    });
  }

  return tags;
}

function formatForNovelAI(tags) {
  const formatted = [];
  
  // Add artist tags with proper formatting
  if (tags.artist.length > 0) {
    formatted.push(...tags.artist.map(tag => `by ${tag.replace(/_/g, ' ')}`));
  }
  
  // Add character tags
  if (tags.character.length > 0) {
    formatted.push(...tags.character.map(tag => tag.replace(/_/g, ' ')));
  }
  
  // Add copyright/series tags
  if (tags.copyright.length > 0) {
    formatted.push(...tags.copyright.map(tag => tag.replace(/_/g, ' ')));
  }
  
  // Add general tags (these are the main descriptive tags)
  if (tags.general.length > 0) {
    formatted.push(...tags.general.map(tag => tag.replace(/_/g, ' ')));
  }
  
  // Filter out meta tags as they're usually not useful for AI generation
  
  return formatted;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Tags copied to clipboard');
    showNotification('Tags copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy tags:', err);
    showNotification('Failed to copy tags', 'error');
  });
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: ${type === 'error' ? '#ff4444' : '#4CAF50'};
    color: white;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: opacity 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractTags') {
    try {
      const tags = extractTags();
      const formattedTags = formatForNovelAI(tags);
      const tagString = formattedTags.join(', ');
      
      // Copy to clipboard
      copyToClipboard(tagString);
      
      sendResponse({
        success: true,
        tags: tags,
        formatted: formattedTags,
        tagString: tagString
      });
    } catch (error) {
      console.error('Error extracting tags:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  return true; // Keep message channel open for async response
});

// Add a button to the page for easier access
function addExtractButton() {
  const button = document.createElement('button');
  button.textContent = 'Copy Tags for NovelAI';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    transition: background-color 0.2s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#0056b3';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#007bff';
  });
  
  button.addEventListener('click', () => {
    const tags = extractTags();
    const formattedTags = formatForNovelAI(tags);
    const tagString = formattedTags.join(', ');
    copyToClipboard(tagString);
  });
  
  document.body.appendChild(button);
}

// Add the button when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addExtractButton);
} else {
  addExtractButton();
}