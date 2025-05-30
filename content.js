// Wrap everything in a self-executing function to prevent scope issues
(function() {
    // ========== CONFIGURATION ========== //
    const replacements = [
        { from: "View post engagements", to: "View Tweet activity" },
        { from: "Not interested in this post", to: "Not interested in this Tweet" },
        { from: "Embed post", to: "Embed Tweet" },
        { from: "Report post", to: "Report Tweet" },
        { from: "x.com", to: "twitter.com" },
        { from: " X.", to: " Twitter." },
        { from: " X,", to: " Twitter," },
        { from: "Posts", to: "Tweets" },
        { from: "Post", to: "Tweet" },
        { from: "posts", to: "tweets" },
        { from: "post", to: "tweet" },
        { from: "Reposts", to: "Retweets" },
        { from: "Repost", to: "Retweet" },
        { from: "reposts", to: "retweets" },
        { from: "repost", to: "retweet" },
        { from: "Quote", to: "Quote Tweet" },
        { from: "quote", to: "quote tweet" }
    ];

    const IGNORED_CLASSES = ['DraftEditor-editorContainer', 'public-DraftEditor-content'];

    // ========== CORE FUNCTIONS ========== //
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function shouldSkip(node) {
        if (!node || !node.nodeType) return true;
        return node.isContentEditable || 
               node.tagName === 'TEXTAREA' || 
               (node.classList && IGNORED_CLASSES.some(cls => node.classList.contains(cls)));
    }

    function replaceText(node) {
        if (shouldSkip(node)) return;

        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            replacements.forEach(({from, to}) => {
                text = text.replace(new RegExp(escapeRegExp(from), 'g'), to);
            });
            node.nodeValue = text;
        } else if (node.childNodes) {
            node.childNodes.forEach(child => replaceText(child));
        }
    }

    function replaceLogo() {
        const logoLink = document.querySelector('a[href="/home"][aria-label="X"]');
        if (logoLink) {
            logoLink.href = "https://twitter.com/home";
            logoLink.innerHTML = '';
            const twitterLogo = document.createElement('img');
            twitterLogo.src = 'https://abs.twimg.com/favicons/twitter.3.ico';
            twitterLogo.style.height = '28px';
            twitterLogo.alt = 'Twitter';
            logoLink.appendChild(twitterLogo);
        }
    }

    function hideVerification() {
      // Handle both apostrophe styles
      const phrases = [
        "You aren't verified yet",
        "You aren’t verified yet" // Different apostrophe character
      ];

      phrases.forEach(phrase => {
        try {
          document.querySelectorAll(`*:contains("${phrase}")`).forEach(el => {
            if (el.textContent.includes(phrase)) {
              el.style.display = 'none';
            }
          });
        } catch (e) {
          console.log('Selector error:', e);
        }
      });

      // Hide verification badges
      document.querySelectorAll('svg[aria-label="Verified account"]').forEach(icon => {
      // Try multiple possible selectors for the badge container
      const selectors = [
        '[data-testid="icon-verified"]',  // Primary selector
        'div[role="presentation"]',      // Fallback 1
        '.verified-badge',               // Fallback 2
        'div > svg'                      // Fallback 3
      ];

      for (const selector of selectors) {
        try {
          const verifiedBadge = icon.closest(selector);
          if (verifiedBadge) {
            verifiedBadge.style.display = 'none';
            verifiedBadge.style.setProperty('display', 'none', 'important');
            break; // Stop after first successful match
          }
        } catch (e) {
          console.debug('Selector failed:', selector, e);
          continue;
        }
      }
    });
    }

    function initObservers() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    replaceText(node);
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        replaceLogo();
                        if (window.hideVerificationEnabled) {
                            hideVerification();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ========== MAIN INITIALIZATION ========== //
    function initExtension() {
        replaceText(document.body);
        replaceLogo();
        
        chrome.storage.sync.get(['hideVerification'], (result) => {
            window.hideVerificationEnabled = result.hideVerification;
            if (result.hideVerification) {
                hideVerification();
            }
        });
        
        initObservers();
    }

    // Start when DOM is ready
    if (document.readyState === 'complete') {
        initExtension();
    } else {
        window.addEventListener('load', initExtension);
    }
})();