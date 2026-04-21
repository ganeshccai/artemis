let personaRefreshTimer = null;
let personaSequence = 0;
let lastUserPersonaRenderAt = 0;
let contactFormOpenTimer = null;
let contactFormOpenPending = false;
let activeDfMessenger = null;
let hasAutoStartedConversation = false;
let isChatWindowOpen = false;
let isMessengerLoaded = false;
let shouldAutoOpenChat = false;
const PERSONA_TEXT_COLOR = "#8f1d56";
const PERSONA_FONT_FAMILY = "Arial, sans-serif";
const PERSONA_FONT_SIZE = "9px";
const PERSONA_FONT_WEIGHT = "400";
const PERSONA_VERTICAL_PULL = "0";
const PERSONA_SOFT_BLUR = "0.35px";
const PERSONA_OPACITY = "0.84";
const USER_PERSONA_TOKEN = encodeURIComponent("🙂User");
const BOT_PERSONA_TOKEN = encodeURIComponent("Bot 🤖");
const CHAT_AUTO_OPEN_DELAY_MS = 5000;
const CHAT_CLIENT_CONTEXT_ENDPOINT = "/chat-client-context";
const CHAT_CLIENT_CONTEXT_STORAGE_KEY = "artemis_chat_client_context";
const CONTACT_FORM_OPEN_DELAY_MS = 3000;
const CONTACT_FORM_OPEN_ACTION = "open_form";
const CONTACT_FORM_ENDPOINT = "/contact-form-submissions";
const API_BASE_URL_META_NAME = "artemis-api-base-url";
const MOBILE_CHAT_BREAKPOINT_PX = 768;
const AUTO_START_CHAT_EVENT_NAME = "WELCOME";
const AUTO_START_CHAT_DELAY_MS = 600;
const LANGUAGE_STORAGE_KEY = "artemis_ui_language";
const DEFAULT_LANGUAGE = "en";
const CHAT_LANGUAGE_OPTIONS = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "te", label: "Telugu" }
];
const SUPPORTED_LANGUAGES = CHAT_LANGUAGE_OPTIONS.map((option) => option.code);
const CHAT_LANGUAGE_DROPDOWN_ID = "artemis-chat-language-dropdown";
const GOOGLE_TRANSLATE_ENDPOINT = "https://translate.googleapis.com/translate_a/single";
const DOM_TRANSLATION_DEBOUNCE_MS = 180;
let activeLanguage = getInitialLanguage();
let latestTranslationRunId = 0;
let translationRefreshTimer = null;
const originalTextNodeContent = new Map();
const originalElementAttributes = new Map();
const googleTranslationCache = new Map();

const UI_TRANSLATIONS = {
    en: {
        contactFormTitle: "Contact Us",
        contactFormSubtitle: "Share your details and we will contact you.",
        closeContactFormAria: "Close contact form",
        namePlaceholder: "Name",
        mobilePlaceholder: "Mobile number",
        emailPlaceholder: "Email",
        messagePlaceholder: "How can we help?",
        submitButton: "Submit",
        languageLabel: "Language",
        statusOpenViaFlask: "Open this page through the Flask app URL to submit the form.",
        statusSubmitting: "Submitting...",
        statusSubmitted: "Submitted successfully.",
        statusSubmissionFailed: "Submission failed. Please try again.",
        contactResponseThanks: "Thank You for sharing the details"
    },
    hi: {
        contactFormTitle: "संपर्क करें",
        contactFormSubtitle: "अपनी जानकारी साझा करें, हम आपसे संपर्क करेंगे।",
        closeContactFormAria: "संपर्क फॉर्म बंद करें",
        namePlaceholder: "नाम",
        mobilePlaceholder: "मोबाइल नंबर",
        emailPlaceholder: "ईमेल",
        messagePlaceholder: "हम आपकी कैसे मदद कर सकते हैं?",
        submitButton: "जमा करें",
        languageLabel: "भाषा",
        statusOpenViaFlask: "फॉर्म जमा करने के लिए इस पेज को Flask ऐप URL से खोलें।",
        statusSubmitting: "जमा किया जा रहा है...",
        statusSubmitted: "सफलतापूर्वक जमा किया गया।",
        statusSubmissionFailed: "जमा नहीं हो सका। कृपया फिर से प्रयास करें।",
        contactResponseThanks: "जानकारी साझा करने के लिए धन्यवाद"
    },
    te: {
        contactFormTitle: "మమ్మల్ని సంప్రదించండి",
        contactFormSubtitle: "మీ వివరాలను పంచుకోండి, మేము మిమ్మల్ని సంప్రదిస్తాము.",
        closeContactFormAria: "సంప్రదింపు ఫారమ్‌ను మూసివేయండి",
        namePlaceholder: "పేరు",
        mobilePlaceholder: "మొబైల్ నంబర్",
        emailPlaceholder: "ఈమెయిల్",
        messagePlaceholder: "మేము మీకు ఎలా సహాయం చేయగలం?",
        submitButton: "సమర్పించండి",
        languageLabel: "భాష",
        statusOpenViaFlask: "ఫారమ్ సమర్పించడానికి ఈ పేజీని Flask యాప్ URL ద్వారా తెరవండి.",
        statusSubmitting: "సమర్పిస్తోంది...",
        statusSubmitted: "విజయవంతంగా సమర్పించబడింది.",
        statusSubmissionFailed: "సమర్పణ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
        contactResponseThanks: "వివరాలు పంచుకున్నందుకు ధన్యవాదాలు"
    }
};

window.addEventListener("DOMContentLoaded", () => {
    applyLanguage(activeLanguage);
    initializeContactForm();
    initializeClientContextCapture();

    setTimeout(() => {
        const df = document.createElement("df-messenger");
        activeDfMessenger = df;
        df.setAttribute("project-id", "project001-474715");
        df.setAttribute("location", "us-central1");
        df.setAttribute("agent-id", "57dcbcf5-05fd-4556-90d4-3438bc6c28d9");
        df.setAttribute("language-code", getChatLanguageCode(activeLanguage));
        df.setAttribute("max-query-length", "-1");
        df.setAttribute("url-allowlist", "*");
        df.setAttribute("storage-option", "none");

        const bubble = document.createElement("df-messenger-chat-bubble");
        bubble.setAttribute("chat-icon", "https://mohanjichronicles.files.wordpress.com/2018/02/lord-hanuman-miracles.jpg");
        bubble.setAttribute("chat-title-icon", "https://mohanjichronicles.files.wordpress.com/2018/02/lord-hanuman-miracles.jpg");
        bubble.setAttribute("chat-title", "Artemis_Hospital");
        bubble.setAttribute("chat-subtitle", "🟢 Online");

        initializeMessengerReadyState(df, bubble);
        df.appendChild(bubble);
        document.body.appendChild(df);

        ensureCircularBubbleIcon(df);
        autoOpenChatWindow(df, bubble, CHAT_AUTO_OPEN_DELAY_MS);
        initializeMobileChatLayout(df);
        initializeChatStateSync(df);
        attachPersonaHandlers(df);
        initializeChatLanguageDropdown(df);
        startPersonaDecorator(df);
    }, 1000);
});

function ensureCircularBubbleIcon(dfMessenger) {
    const startTime = Date.now();
    const maxWaitMs = 10000;
    const intervalMs = 250;

    const applyBubbleIconStyle = () => {
        const roots = collectSearchRoots(dfMessenger);
        let styled = false;

        for (const root of roots) {
            if (!root || !root.querySelectorAll) {
                continue;
            }

            const launcherSelectors = [
                "button[aria-label*='Open'] img",
                "button[aria-label*='open'] img",
                "button[aria-label*='Chat'] img",
                "button[aria-label*='chat'] img",
                "div[role='button'][aria-label*='Open'] img",
                "div[role='button'][aria-label*='open'] img",
                "div[role='button'][aria-label*='Chat'] img",
                "div[role='button'][aria-label*='chat'] img"
            ];

            for (const selector of launcherSelectors) {
                const images = root.querySelectorAll(selector);
                for (const image of images) {
                    image.style.setProperty("border-radius", "50%", "important");
                    image.style.setProperty("clip-path", "circle(50%)", "important");
                    image.style.setProperty("object-fit", "cover", "important");
                    image.style.setProperty("aspect-ratio", "1 / 1", "important");
                    image.style.setProperty("overflow", "hidden", "important");
                    image.style.setProperty("display", "block", "important");

                    if (image.parentElement) {
                        image.parentElement.style.setProperty("border-radius", "50%", "important");
                        image.parentElement.style.setProperty("overflow", "hidden", "important");
                    }

                    styled = true;
                }
            }
        }

        return styled;
    };

    if (applyBubbleIconStyle()) {
        return;
    }

    const timer = window.setInterval(() => {
        const styled = applyBubbleIconStyle();
        const timedOut = Date.now() - startTime > maxWaitMs;

        if (styled || timedOut) {
            window.clearInterval(timer);
        }
    }, intervalMs);
}

function autoOpenChatWindow(dfMessenger, bubbleNode, delayMs) {
    window.setTimeout(() => {
        shouldAutoOpenChat = true;

        if (isMessengerLoaded) {
            openChatWindow(dfMessenger, bubbleNode);
        }
    }, delayMs);
}

function initializeMessengerReadyState(dfMessenger, bubbleNode) {
    window.addEventListener("df-messenger-loaded", () => {
        if (activeDfMessenger !== dfMessenger) {
            return;
        }

        isMessengerLoaded = true;

        if (shouldAutoOpenChat) {
            openChatWindow(dfMessenger, bubbleNode);
        }
    });
}

function openChatWindow(dfMessenger, bubbleNode) {
    if (bubbleNode && typeof bubbleNode.openChat === "function") {
        bubbleNode.openChat();
    }

    if (!isChatWindowOpen) {
        tryOpenChatByClick(dfMessenger);
    }

    window.setTimeout(() => {
        if (!isChatWindowOpen) {
            tryOpenChatByClick(dfMessenger);
        }
    }, 250);
}

function scheduleAutoStartConversation(dfMessenger) {
    if (!dfMessenger || hasAutoStartedConversation) {
        return;
    }

    const triggerConversationStart = () => {
        window.setTimeout(() => {
            startConversationWithWelcomeEvent(dfMessenger);
        }, AUTO_START_CHAT_DELAY_MS);
    };

    if (typeof dfMessenger.sendRequest === "function") {
        triggerConversationStart();
        return;
    }

    const onMessengerLoaded = () => {
        window.removeEventListener("df-messenger-loaded", onMessengerLoaded);
        triggerConversationStart();
    };

    window.addEventListener("df-messenger-loaded", onMessengerLoaded);
}

function startConversationWithWelcomeEvent(dfMessenger) {
    if (!dfMessenger || hasAutoStartedConversation || typeof dfMessenger.sendRequest !== "function") {
        return;
    }

    hasAutoStartedConversation = true;

    dfMessenger.sendRequest("event", AUTO_START_CHAT_EVENT_NAME).catch(() => {
        hasAutoStartedConversation = false;
    });
}

function tryOpenChatByClick(dfMessenger) {
    const roots = collectSearchRoots(dfMessenger);
    const buttonSelectors = [
        "button[aria-label*='Open']",
        "button[aria-label*='open']",
        "button[aria-label*='Chat']",
        "button[aria-label*='chat']",
        "div[role='button'][aria-label*='Open']",
        "div[role='button'][aria-label*='open']",
        "div[role='button'][aria-label*='Chat']",
        "div[role='button'][aria-label*='chat']"
    ];

    for (const root of roots) {
        if (!root || !root.querySelector) {
            continue;
        }

        for (const selector of buttonSelectors) {
            const openButton = root.querySelector(selector);
            if (openButton && typeof openButton.click === "function") {
                openButton.click();
                return true;
            }
        }
    }

    return false;
}

function initializeMobileChatLayout(dfMessenger) {
    if (!dfMessenger) {
        return;
    }

    const applyLayout = () => {
        if (!isMobileViewport()) {
            dfMessenger.style.removeProperty("--df-messenger-chat-window-width");
            dfMessenger.style.removeProperty("--df-messenger-chat-window-height");
            dfMessenger.style.removeProperty("right");
            dfMessenger.style.removeProperty("left");
            dfMessenger.style.removeProperty("bottom");
            return;
        }

        const viewport = window.visualViewport;
        const viewportWidth = viewport ? viewport.width : window.innerWidth;
        const viewportHeight = viewport ? viewport.height : window.innerHeight;
        const horizontalInset = 12;
        const bottomInset = 10;
        const topInset = 14;
        const availableWidth = Math.max(280, Math.floor(viewportWidth - horizontalInset * 2));
        const availableHeight = Math.max(340, Math.floor(viewportHeight - topInset - bottomInset));

        dfMessenger.style.setProperty("right", `${horizontalInset}px`);
        dfMessenger.style.setProperty("left", `${horizontalInset}px`);
        dfMessenger.style.setProperty("bottom", `${bottomInset}px`);
        dfMessenger.style.setProperty("--df-messenger-chat-window-width", `${availableWidth}px`);
        dfMessenger.style.setProperty("--df-messenger-chat-window-height", `${availableHeight}px`);
    };

    applyLayout();
    window.addEventListener("resize", applyLayout);

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", applyLayout);
        window.visualViewport.addEventListener("scroll", applyLayout);
    }

    document.addEventListener("focusin", applyLayout);
    document.addEventListener("focusout", () => {
        window.setTimeout(applyLayout, 120);
    });
}

function isMobileViewport() {
    return window.innerWidth <= MOBILE_CHAT_BREAKPOINT_PX;
}

function initializeChatStateSync(dfMessenger) {
    if (!dfMessenger) {
        return;
    }

    window.addEventListener("df-chat-open-changed", (event) => {
        isChatWindowOpen = !!(event && event.detail && event.detail.isOpen);

        if (isChatWindowOpen) {
            scheduleAutoStartConversation(dfMessenger);
            return;
        }

        closeContactForm();
    });

    document.addEventListener("click", (event) => {
        if (didUserCloseChat(event)) {
            closeContactForm();
        }
    }, true);

    const observer = new MutationObserver(() => {
        if (!isChatExpanded(dfMessenger)) {
            closeContactForm();
        }
    });

    observer.observe(dfMessenger, {
        attributes: true,
        attributeFilter: ["expand"]
    });
}

function didUserCloseChat(event) {
    const eventPath = typeof event.composedPath === "function" ? event.composedPath() : [];

    return eventPath.some((node) => {
        if (!node || typeof node.getAttribute !== "function") {
            return false;
        }

        const ariaLabel = (node.getAttribute("aria-label") || "").toLowerCase();
        const dataTestId = (node.getAttribute("data-testid") || "").toLowerCase();
        const textContent = typeof node.textContent === "string" ? node.textContent.toLowerCase() : "";

        return /close|collapse|minimize/.test(ariaLabel)
            || /close|collapse|minimize/.test(dataTestId)
            || /close|collapse|minimize/.test(textContent);
    });
}

function isChatExpanded(dfMessenger) {
    if (!dfMessenger) {
        return false;
    }

    if (typeof dfMessenger.expand === "boolean") {
        return dfMessenger.expand;
    }

    const expandAttribute = (dfMessenger.getAttribute("expand") || "").toLowerCase();
    return expandAttribute === "true";
}

function attachPersonaHandlers(dfMessenger) {
    window.addEventListener("df-user-input-entered", () => {
        renderUserPersona(dfMessenger);
    });

    window.addEventListener("df-request-sent", (event) => {
        const requestBody = event.detail && event.detail.data ? event.detail.data.requestBody : null;
        const queryText = requestBody && requestBody.queryInput && requestBody.queryInput.text
            ? requestBody.queryInput.text.text
            : "";

        if (typeof queryText === "string" && queryText.trim()) {
            renderUserPersona(dfMessenger);
        }
    });

    window.addEventListener("df-response-received", (event) => {
        const messages = event.detail && event.detail.data && Array.isArray(event.detail.data.messages)
            ? event.detail.data.messages
            : [];

        const requestedLanguage = extractLanguageFromResponse(event);
        if (requestedLanguage) {
            applyLanguage(requestedLanguage);
        }

        if (shouldOpenContactForm(event)) {
            contactFormOpenPending = true;
        }

        if (messages.length > 0) {
            renderPersona(dfMessenger, "bot", "Bot 🤖");
        }

        if (contactFormOpenPending) {
            scheduleContactFormOpen();
        }

        scheduleDomTranslationRefresh();
    });
}

function initializeContactForm() {
    const form = document.getElementById("contact-form-fields");
    const closeButton = document.getElementById("contact-form-close");

    if (form) {
        form.addEventListener("submit", submitContactForm);
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeContactForm);
    }
}

function initializeClientContextCapture() {
    const endpoint = getApiEndpoint(CHAT_CLIENT_CONTEXT_ENDPOINT);
    const clientContext = getClientContext();

    if (!endpoint || !clientContext.client_session_id) {
        return;
    }

    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ client_context: clientContext }),
        keepalive: true
    }).catch(() => {
        // Ignore telemetry failures so the chat UI stays responsive.
    });
}

function shouldOpenContactForm(event) {
    const responseMessages = event && event.detail && event.detail.raw && event.detail.raw.queryResult
        && Array.isArray(event.detail.raw.queryResult.responseMessages)
        ? event.detail.raw.queryResult.responseMessages
        : [];

    const messengerMessages = event && event.detail && event.detail.data && Array.isArray(event.detail.data.messages)
        ? event.detail.data.messages
        : [];

    return [...responseMessages, ...messengerMessages].some(messageContainsOpenFormAction);
}

function extractLanguageFromResponse(event) {
    const responseMessages = event && event.detail && event.detail.raw && event.detail.raw.queryResult
        && Array.isArray(event.detail.raw.queryResult.responseMessages)
        ? event.detail.raw.queryResult.responseMessages
        : [];

    const messengerMessages = event && event.detail && event.detail.data && Array.isArray(event.detail.data.messages)
        ? event.detail.data.messages
        : [];

    for (const message of [...responseMessages, ...messengerMessages]) {
        const payload = extractPayload(message);
        if (!payload || payload.action !== "set_language") {
            continue;
        }

        const languageCode = typeof payload.language_code === "string"
            ? payload.language_code.trim().toLowerCase()
            : "";

        if (SUPPORTED_LANGUAGES.includes(languageCode)) {
            return languageCode;
        }
    }

    return "";
}

function messageContainsOpenFormAction(message) {
    if (!message || typeof message !== "object") {
        return false;
    }

    const payload = extractPayload(message);
    return payload && payload.action === CONTACT_FORM_OPEN_ACTION;
}

function extractPayload(message) {
    if (!message || !message.payload) {
        return null;
    }

    if (typeof message.payload.action === "string") {
        return message.payload;
    }

    if (message.payload.fields) {
        return convertStructFieldsToObject(message.payload.fields);
    }

    return null;
}

function convertStructFieldsToObject(fields) {
    const result = {};

    for (const [key, value] of Object.entries(fields)) {
        result[key] = convertDialogflowValue(value);
    }

    return result;
}

function convertDialogflowValue(value) {
    if (!value || typeof value !== "object") {
        return value;
    }

    if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
        return value.stringValue;
    }

    if (Object.prototype.hasOwnProperty.call(value, "numberValue")) {
        return value.numberValue;
    }

    if (Object.prototype.hasOwnProperty.call(value, "boolValue")) {
        return value.boolValue;
    }

    if (value.structValue && value.structValue.fields) {
        return convertStructFieldsToObject(value.structValue.fields);
    }

    if (value.listValue && Array.isArray(value.listValue.values)) {
        return value.listValue.values.map(convertDialogflowValue);
    }

    return null;
}

function openContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");

    if (!form) {
        return;
    }

    if (status) {
        status.textContent = "";
        status.classList.remove("is-success", "is-error");
    }

    form.classList.add("is-open");
    form.setAttribute("aria-hidden", "false");
    contactFormOpenPending = false;
}

function closeContactForm() {
    const form = document.getElementById("contact-form");

    contactFormOpenPending = false;

    if (contactFormOpenTimer) {
        window.clearTimeout(contactFormOpenTimer);
        contactFormOpenTimer = null;
    }

    if (!form) {
        return;
    }

    form.classList.remove("is-open");
    form.setAttribute("aria-hidden", "true");
}

function scheduleContactFormOpen() {
    if (contactFormOpenTimer) {
        window.clearTimeout(contactFormOpenTimer);
    }

    contactFormOpenTimer = window.setTimeout(() => {
        contactFormOpenTimer = null;

        if (!contactFormOpenPending) {
            return;
        }

        openContactForm();
    }, CONTACT_FORM_OPEN_DELAY_MS);
}

function submitContactForm(event) {
    event.preventDefault();

    const nameInput = document.getElementById("contact-name");
    const mobileInput = document.getElementById("contact-mobile");
    const emailInput = document.getElementById("contact-email");
    const messageInput = document.getElementById("contact-message");
    const submitButton = document.getElementById("contact-form-submit");
    const status = document.getElementById("contact-form-status");

    const payload = {
        name: nameInput ? nameInput.value.trim() : "",
        mobile: mobileInput ? mobileInput.value.trim() : "",
        email: emailInput ? emailInput.value.trim() : "",
        message: messageInput ? messageInput.value.trim() : "",
        client_context: getClientContext()
    };
    const endpoint = getApiEndpoint(CONTACT_FORM_ENDPOINT);

    if (!endpoint) {
        if (status) {
            status.textContent = getTranslation("statusOpenViaFlask");
            status.classList.add("is-error");
            status.classList.remove("is-success");
        }
        return;
    }

    if (status) {
        status.textContent = getTranslation("statusSubmitting");
        status.classList.remove("is-success", "is-error");
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(async (response) => {
            const responseText = await response.text();
            let responsePayload = {};

            try {
                responsePayload = responseText ? JSON.parse(responseText) : {};
            } catch {
                responsePayload = {};
            }

            if (!response.ok) {
                const fallbackMessage = responseText
                    ? `Unable to submit the form. HTTP ${response.status}: ${responseText.slice(0, 160)}`
                    : `Unable to submit the form. HTTP ${response.status}`;
                throw new Error(responsePayload.error || responsePayload.message || fallbackMessage);
            }

            if (status) {
                status.textContent = responsePayload.message || getTranslation("statusSubmitted");
                status.classList.add("is-success");
                status.classList.remove("is-error");
            }

            renderContactFormSubmissionResponse(payload.name, payload.mobile);

            if (nameInput) {
                nameInput.value = "";
            }

            if (mobileInput) {
                mobileInput.value = "";
            }

            if (emailInput) {
                emailInput.value = "";
            }

            if (messageInput) {
                messageInput.value = "";
            }

            closeContactForm();
        })
        .catch((error) => {
            if (status) {
                status.textContent = error.message || getTranslation("statusSubmissionFailed");
                status.classList.add("is-error");
                status.classList.remove("is-success");
            }
        })
        .finally(() => {
            if (submitButton) {
                submitButton.disabled = false;
            }
        });
}

function renderContactFormSubmissionResponse(name, mobile) {
    if (!activeDfMessenger || typeof activeDfMessenger.renderCustomText !== "function") {
        return;
    }

    const safeName = name || "-";
    const safeMobile = mobile || "-";
    const responseText = [
        `Name - ${safeName}`,
        `mobile - ${safeMobile}`,
        getTranslation("contactResponseThanks")
    ].join("  \n");

    renderPersona(activeDfMessenger, "bot", "Bot 🤖");
    activeDfMessenger.renderCustomText(responseText, true);
}

function applyLanguage(languageCode) {
    const nextLanguage = normalizeLanguage(languageCode);
    activeLanguage = nextLanguage;
    persistLanguage(nextLanguage);

    const textNodes = document.querySelectorAll("[data-i18n]");
    for (const node of textNodes) {
        const key = node.getAttribute("data-i18n") || "";
        node.textContent = getTranslation(key);
    }

    const placeholderNodes = document.querySelectorAll("[data-i18n-placeholder]");
    for (const node of placeholderNodes) {
        const key = node.getAttribute("data-i18n-placeholder") || "";
        node.setAttribute("placeholder", getTranslation(key));
    }

    const ariaNodes = document.querySelectorAll("[data-i18n-aria-label]");
    for (const node of ariaNodes) {
        const key = node.getAttribute("data-i18n-aria-label") || "";
        node.setAttribute("aria-label", getTranslation(key));
    }

    syncChatLanguageDropdownValue(nextLanguage);

    if (activeDfMessenger) {
        activeDfMessenger.setAttribute("language-code", getChatLanguageCode(nextLanguage));
    }

    scheduleDomTranslationRefresh();
}

function initializeChatLanguageDropdown(dfMessenger) {
    const ensureMounted = () => {
        mountChatLanguageDropdown(dfMessenger);
    };

    ensureMounted();

    window.addEventListener("df-chat-open-changed", () => {
        window.setTimeout(ensureMounted, 120);
    });

    window.setInterval(ensureMounted, 1200);
}

function mountChatLanguageDropdown(dfMessenger) {
    if (!dfMessenger) {
        return;
    }

    const host = findChatFooterHost(dfMessenger);
    if (!host) {
        return;
    }

    if (host.querySelector(`#${CHAT_LANGUAGE_DROPDOWN_ID}`)) {
        syncChatLanguageDropdownValue(activeLanguage);
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-artemis-chat-language", "true");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "flex-end";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px";
    wrapper.style.marginTop = "6px";
    wrapper.style.paddingTop = "4px";
    wrapper.style.borderTop = "1px solid rgba(15, 118, 110, 0.16)";

    const label = document.createElement("label");
    label.setAttribute("for", CHAT_LANGUAGE_DROPDOWN_ID);
    label.textContent = getTranslation("languageLabel");
    label.style.fontSize = "11px";
    label.style.fontWeight = "700";
    label.style.color = "#0f766e";

    const select = document.createElement("select");
    select.id = CHAT_LANGUAGE_DROPDOWN_ID;
    select.setAttribute("aria-label", getTranslation("languageLabel"));
    select.style.border = "1px solid #cfe0e8";
    select.style.borderRadius = "10px";
    select.style.background = "#ffffff";
    select.style.color = "#0f172a";
    select.style.font = "600 12px Manrope, Segoe UI, sans-serif";
    select.style.padding = "5px 8px";
    select.style.outline = "none";
    select.style.cursor = "pointer";

    for (const optionData of CHAT_LANGUAGE_OPTIONS) {
        const option = document.createElement("option");
        option.value = optionData.code;
        option.textContent = optionData.label;
        select.appendChild(option);
    }

    select.value = activeLanguage;
    select.addEventListener("change", (event) => {
        const selectedValue = event.target && event.target.value ? event.target.value : DEFAULT_LANGUAGE;
        applyLanguage(selectedValue);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    host.appendChild(wrapper);
}

function findChatFooterHost(dfMessenger) {
    const roots = collectSearchRoots(dfMessenger);
    const selectors = [
        "form",
        "[data-testid*='input']",
        "[class*='input']",
        "[part*='input']",
        "footer"
    ];

    for (const root of roots) {
        if (!root || root === document || !root.querySelectorAll) {
            continue;
        }

        for (const selector of selectors) {
            const candidates = root.querySelectorAll(selector);

            for (const candidate of candidates) {
                if (!candidate || !candidate.querySelector) {
                    continue;
                }

                const hasMessageInput = candidate.querySelector("textarea, input[type='text'], [contenteditable='true']");
                if (!hasMessageInput) {
                    continue;
                }

                if (candidate.querySelector(`[id='${CHAT_LANGUAGE_DROPDOWN_ID}']`)) {
                    return candidate;
                }

                return candidate;
            }
        }
    }

    return null;
}

function syncChatLanguageDropdownValue(languageCode) {
    const dropdowns = document.querySelectorAll(`#${CHAT_LANGUAGE_DROPDOWN_ID}`);

    for (const dropdown of dropdowns) {
        dropdown.value = normalizeLanguage(languageCode);
        dropdown.setAttribute("aria-label", getTranslation("languageLabel"));

        const label = dropdown.previousElementSibling;
        if (label && label.tagName === "LABEL") {
            label.textContent = getTranslation("languageLabel");
        }
    }

    if (activeDfMessenger && activeDfMessenger.shadowRoot) {
        const shadowDropdown = activeDfMessenger.shadowRoot.querySelector(`#${CHAT_LANGUAGE_DROPDOWN_ID}`);
        if (shadowDropdown) {
            shadowDropdown.value = normalizeLanguage(languageCode);
            shadowDropdown.setAttribute("aria-label", getTranslation("languageLabel"));

            const label = shadowDropdown.previousElementSibling;
            if (label && label.tagName === "LABEL") {
                label.textContent = getTranslation("languageLabel");
            }
        }
    }
}

function getTranslation(key) {
    const translationTable = UI_TRANSLATIONS[activeLanguage] || UI_TRANSLATIONS[DEFAULT_LANGUAGE];
    return translationTable[key] || UI_TRANSLATIONS[DEFAULT_LANGUAGE][key] || key;
}

function scheduleDomTranslationRefresh() {
    if (translationRefreshTimer) {
        window.clearTimeout(translationRefreshTimer);
    }

    translationRefreshTimer = window.setTimeout(() => {
        translationRefreshTimer = null;
        applyDomTranslation(activeLanguage);
    }, DOM_TRANSLATION_DEBOUNCE_MS);
}

async function applyDomTranslation(languageCode) {
    const normalizedLanguage = normalizeLanguage(languageCode);
    const runId = latestTranslationRunId + 1;
    latestTranslationRunId = runId;

    if (normalizedLanguage === DEFAULT_LANGUAGE) {
        restoreOriginalDomContent();
        return;
    }

    const targets = collectTranslationTargets();
    if (!targets.length) {
        return;
    }

    const uniqueTexts = [...new Set(targets.map((target) => target.text))];
    const translatedLookup = new Map();

    await Promise.all(uniqueTexts.map(async (sourceText) => {
        const translatedText = await translateTextUsingGoogle(sourceText, normalizedLanguage);
        translatedLookup.set(sourceText, translatedText || sourceText);
    }));

    if (runId !== latestTranslationRunId) {
        return;
    }

    for (const target of targets) {
        const translatedText = translatedLookup.get(target.text) || target.text;

        if (target.type === "text") {
            target.node.nodeValue = translatedText;
            continue;
        }

        if (target.type === "attr") {
            target.element.setAttribute(target.attribute, translatedText);
        }
    }
}

function collectTranslationTargets() {
    const targets = [];
    const roots = getTranslationRoots();

    for (const root of roots) {
        if (!root) {
            continue;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let currentTextNode = walker.nextNode();

        while (currentTextNode) {
            const parentElement = currentTextNode.parentElement;

            if (isTranslatableTextNode(currentTextNode, parentElement)) {
                if (!originalTextNodeContent.has(currentTextNode)) {
                    originalTextNodeContent.set(currentTextNode, currentTextNode.nodeValue || "");
                }

                const sourceText = (originalTextNodeContent.get(currentTextNode) || "").trim();
                if (sourceText) {
                    targets.push({
                        type: "text",
                        node: currentTextNode,
                        text: sourceText
                    });
                }
            }

            currentTextNode = walker.nextNode();
        }

        if (root.querySelectorAll) {
            const attributeElements = root.querySelectorAll("input[placeholder], textarea[placeholder], button[aria-label], [title]");

            for (const element of attributeElements) {
                if (shouldSkipTranslationElement(element)) {
                    continue;
                }

                const attributesToTranslate = ["placeholder", "aria-label", "title"];

                for (const attribute of attributesToTranslate) {
                    const currentValue = element.getAttribute(attribute);
                    if (!currentValue || !isLikelyNaturalLanguage(currentValue)) {
                        continue;
                    }

                    if (!originalElementAttributes.has(element)) {
                        originalElementAttributes.set(element, {});
                    }

                    const originalAttributes = originalElementAttributes.get(element);
                    if (!Object.prototype.hasOwnProperty.call(originalAttributes, attribute)) {
                        originalAttributes[attribute] = currentValue;
                    }

                    const sourceText = (originalAttributes[attribute] || "").trim();
                    if (sourceText) {
                        targets.push({
                            type: "attr",
                            element,
                            attribute,
                            text: sourceText
                        });
                    }
                }
            }
        }
    }

    return targets;
}

function getTranslationRoots() {
    const roots = [document.body];

    if (activeDfMessenger) {
        const messengerRoots = collectSearchRoots(activeDfMessenger);
        for (const root of messengerRoots) {
            if (root && !roots.includes(root)) {
                roots.push(root);
            }
        }
    }

    return roots;
}

function isTranslatableTextNode(textNode, parentElement) {
    if (!textNode || !parentElement) {
        return false;
    }

    if (!textNode.nodeValue || !isLikelyNaturalLanguage(textNode.nodeValue)) {
        return false;
    }

    if (shouldSkipTranslationElement(parentElement)) {
        return false;
    }

    return true;
}

function shouldSkipTranslationElement(element) {
    if (!element || !element.closest) {
        return true;
    }

    if (element.closest("script, style, noscript, code, pre, svg, .persona-badge")) {
        return true;
    }

    if (element.closest("#contact-form-fields") && element.matches("input, textarea")) {
        return true;
    }

    return false;
}

function isLikelyNaturalLanguage(value) {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) {
        return false;
    }

    if (/^[\d\s.,:;!?()\-_/\\]+$/.test(text)) {
        return false;
    }

    if (/^https?:\/\//i.test(text)) {
        return false;
    }

    return true;
}

function restoreOriginalDomContent() {
    for (const [textNode, originalValue] of originalTextNodeContent.entries()) {
        if (textNode && textNode.isConnected) {
            textNode.nodeValue = originalValue;
        }
    }

    for (const [element, attributes] of originalElementAttributes.entries()) {
        if (!element || !element.isConnected) {
            continue;
        }

        for (const [attribute, originalValue] of Object.entries(attributes)) {
            if (typeof originalValue === "string") {
                element.setAttribute(attribute, originalValue);
            }
        }
    }
}

async function translateTextUsingGoogle(sourceText, targetLanguage) {
    const cacheKey = `${targetLanguage}::${sourceText}`;
    if (googleTranslationCache.has(cacheKey)) {
        return googleTranslationCache.get(cacheKey);
    }

    try {
        const queryParams = new URLSearchParams({
            client: "gtx",
            sl: "auto",
            tl: targetLanguage,
            dt: "t",
            q: sourceText
        });
        const endpoint = `${GOOGLE_TRANSLATE_ENDPOINT}?${queryParams.toString()}`;
        const response = await fetch(endpoint, { method: "GET" });

        if (!response.ok) {
            googleTranslationCache.set(cacheKey, sourceText);
            return sourceText;
        }

        const payload = await response.json();
        const translatedText = extractGoogleTranslatedText(payload) || sourceText;
        googleTranslationCache.set(cacheKey, translatedText);
        return translatedText;
    } catch {
        googleTranslationCache.set(cacheKey, sourceText);
        return sourceText;
    }
}

function extractGoogleTranslatedText(payload) {
    if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
        return "";
    }

    return payload[0]
        .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
        .join("")
        .trim();
}

function getInitialLanguage() {
    try {
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (SUPPORTED_LANGUAGES.includes(storedLanguage)) {
            return storedLanguage;
        }
    } catch {
        // Ignore storage failures and fall back to defaults.
    }

    const browserLanguage = (navigator.language || "").toLowerCase();
    if (browserLanguage.startsWith("hi")) {
        return "hi";
    }

    if (browserLanguage.startsWith("te")) {
        return "te";
    }

    return DEFAULT_LANGUAGE;
}

function getChatLanguageCode(languageCode) {
    const normalizedLanguage = normalizeLanguage(languageCode);
    return normalizedLanguage === "hi" || normalizedLanguage === "te"
        ? normalizedLanguage
        : "en";
}

function persistLanguage(languageCode) {
    try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(languageCode));
    } catch {
        // Ignore storage failures in restricted browser modes.
    }
}

function normalizeLanguage(languageCode) {
    const normalizedCode = (languageCode || "").toLowerCase();
    return SUPPORTED_LANGUAGES.includes(normalizedCode) ? normalizedCode : DEFAULT_LANGUAGE;
}


function getApiEndpoint(pathname) {
    if (window.location.protocol === "file:") {
        return null;
    }

    const configuredBaseUrl = getConfiguredApiBaseUrl();
    const baseUrl = configuredBaseUrl || window.location.origin;

    return new URL(pathname, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

function getConfiguredApiBaseUrl() {
    const globalBaseUrl = typeof window.ARTEMIS_API_BASE_URL === "string"
        ? window.ARTEMIS_API_BASE_URL.trim()
        : "";

    if (globalBaseUrl) {
        return globalBaseUrl;
    }

    const metaTag = document.querySelector(`meta[name="${API_BASE_URL_META_NAME}"]`);
    const metaBaseUrl = metaTag && typeof metaTag.content === "string"
        ? metaTag.content.trim()
        : "";

    return metaBaseUrl || "";
}

function getClientContext() {
    const storedContext = readStoredClientContext();
    const userAgent = navigator.userAgent || "";
    const browserName = detectBrowserName(userAgent);
    const browserVersion = detectBrowserVersion(userAgent);
    const osName = detectOperatingSystem(userAgent, navigator.platform || "");
    const deviceType = detectDeviceType(userAgent);
    const clientContext = {
        ...storedContext,
        client_session_id: storedContext.client_session_id || createClientSessionId(),
        source_url: window.location.href || "",
        page_origin: window.location.origin || "",
        page_path: window.location.pathname || "",
        page_hostname: window.location.hostname || "",
        referrer_url: document.referrer || "",
        user_agent: userAgent,
        browser_name: browserName,
        browser_version: browserVersion,
        os_name: osName,
        device_type: deviceType,
        device_name: buildDeviceName(deviceType, osName, browserName),
        browser_language: navigator.language || "",
        browser_languages: Array.isArray(navigator.languages)
            ? navigator.languages.filter((value) => typeof value === "string" && value.trim())
            : [],
        platform: navigator.platform || "",
        timezone: getBrowserTimeZone(),
        screen_resolution: getScreenResolution(),
        viewport_size: `${window.innerWidth || 0}x${window.innerHeight || 0}`
    };

    persistClientContext(clientContext);
    return clientContext;
}

function readStoredClientContext() {
    try {
        const rawValue = window.sessionStorage.getItem(CHAT_CLIENT_CONTEXT_STORAGE_KEY);
        if (!rawValue) {
            return {};
        }

        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
    } catch {
        return {};
    }
}

function persistClientContext(clientContext) {
    try {
        window.sessionStorage.setItem(
            CHAT_CLIENT_CONTEXT_STORAGE_KEY,
            JSON.stringify(clientContext)
        );
    } catch {
        // Session storage can fail in privacy-restricted browsers.
    }
}

function createClientSessionId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function detectBrowserName(userAgent) {
    const browserMatchers = [
        [/Edg\/([\d.]+)/, "Edge"],
        [/OPR\/([\d.]+)/, "Opera"],
        [/Chrome\/([\d.]+)/, "Chrome"],
        [/Firefox\/([\d.]+)/, "Firefox"],
        [/Version\/([\d.]+).*Safari/, "Safari"],
        [/MSIE\s([\d.]+)/, "Internet Explorer"],
        [/Trident\/.*rv:([\d.]+)/, "Internet Explorer"]
    ];

    for (const [matcher, browserName] of browserMatchers) {
        if (matcher.test(userAgent)) {
            return browserName;
        }
    }

    return "Unknown";
}

function detectBrowserVersion(userAgent) {
    const versionMatchers = [
        /Edg\/([\d.]+)/,
        /OPR\/([\d.]+)/,
        /Chrome\/([\d.]+)/,
        /Firefox\/([\d.]+)/,
        /Version\/([\d.]+).*Safari/,
        /MSIE\s([\d.]+)/,
        /Trident\/.*rv:([\d.]+)/
    ];

    for (const matcher of versionMatchers) {
        const match = userAgent.match(matcher);
        if (match && match[1]) {
            return match[1];
        }
    }

    return "";
}

function detectOperatingSystem(userAgent, platform) {
    const normalizedUserAgent = userAgent.toLowerCase();
    const normalizedPlatform = platform.toLowerCase();

    if (normalizedUserAgent.includes("windows") || normalizedPlatform.includes("win")) {
        return "Windows";
    }

    if (normalizedUserAgent.includes("android")) {
        return "Android";
    }

    if (/iphone|ipad|ipod/.test(normalizedUserAgent)) {
        return "iOS";
    }

    if (normalizedUserAgent.includes("mac os") || normalizedPlatform.includes("mac")) {
        return "macOS";
    }

    if (normalizedUserAgent.includes("linux") || normalizedPlatform.includes("linux")) {
        return "Linux";
    }

    return "Unknown";
}

function detectDeviceType(userAgent) {
    const normalizedUserAgent = userAgent.toLowerCase();

    if (/ipad|tablet/.test(normalizedUserAgent)) {
        return "tablet";
    }

    if (/mobi|iphone|android/.test(normalizedUserAgent)) {
        return "mobile";
    }

    return "desktop";
}

function buildDeviceName(deviceType, osName, browserName) {
    return [deviceType, osName, browserName]
        .filter((value) => typeof value === "string" && value && value !== "Unknown")
        .join(" / ");
}

function getBrowserTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
        return "";
    }
}

function getScreenResolution() {
    if (!window.screen) {
        return "";
    }

    return `${window.screen.width || 0}x${window.screen.height || 0}`;
}

function renderUserPersona(dfMessenger) {
    const now = Date.now();
    if (now - lastUserPersonaRenderAt < 300) {
        return;
    }

    lastUserPersonaRenderAt = now;
    renderPersona(dfMessenger, "user", "🙂User");
}

function renderPersona(dfMessenger, personaType, label) {
    const nonce = `${personaType}-${Date.now()}-${personaSequence += 1}`;
    dfMessenger.renderCustomText(createPersonaBadgeMarkdown(label, getIstTimeLabel(), nonce), true);
}

function getIstTimeLabel() {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(new Date());
}

function createPersonaBadgeMarkdown(label, timeLabel, nonce = "") {
    const imageUrl = createPersonaBadgeDataUrl(label, timeLabel, nonce);
    return `![](${imageUrl})`;
}

function createPersonaBadgeDataUrl(label, timeLabel, nonce = "") {
    const content = `${label}  ${timeLabel}`;
    const width = Math.max(128, Math.round(content.length * 6.1 + 24));
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28">
            <desc>${escapeXml(nonce)}</desc>
            <defs>
                <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="0.25" />
                </filter>
            </defs>
            <text x="8" y="19" font-family="${PERSONA_FONT_FAMILY}" font-size="${PERSONA_FONT_SIZE}" font-weight="${PERSONA_FONT_WEIGHT}" fill="${PERSONA_TEXT_COLOR}" opacity="0.84" filter="url(#softBlur)">${escapeXml(content)}</text>
        </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function startPersonaDecorator(dfMessenger) {
    const refresh = () => {
        decoratePersonaMessages(dfMessenger);
    };

    refresh();

    if (!personaRefreshTimer) {
        personaRefreshTimer = window.setInterval(refresh, 500);
    }
}

function collectSearchRoots(dfMessenger) {
    const roots = [document];
    const queue = [document, dfMessenger].filter(Boolean);

    for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];
        if (!current) {
            continue;
        }

        if (current.shadowRoot && !roots.includes(current.shadowRoot)) {
            roots.push(current.shadowRoot);
            queue.push(current.shadowRoot);
        }

        if (!current.querySelectorAll) {
            continue;
        }

        for (const node of current.querySelectorAll("*")) {
            if (node.shadowRoot && !roots.includes(node.shadowRoot)) {
                roots.push(node.shadowRoot);
                queue.push(node.shadowRoot);
            }
        }
    }

    return roots;
}

function decoratePersonaMessages(dfMessenger) {
    const roots = collectSearchRoots(dfMessenger);

    for (const root of roots) {
        if (!root || !root.querySelectorAll) {
            continue;
        }

        const personaImages = root.querySelectorAll("img[src^='data:image/svg+xml']");
        for (const image of personaImages) {
            const personaType = getPersonaType(image);
            const container = findPersonaContainer(image, root);
            if (!container || !personaType) {
                continue;
            }

            if (image.dataset.artemisPersonaStyled === personaType) {
                continue;
            }

            stylePersonaContainer(container, image, personaType);
        }
    }
}

function getPersonaType(imageNode) {
    const source = imageNode && imageNode.getAttribute ? imageNode.getAttribute("src") || "" : "";
    if (source.includes(USER_PERSONA_TOKEN)) {
        return "user";
    }

    if (source.includes(BOT_PERSONA_TOKEN)) {
        return "bot";
    }

    return null;
}

function findPersonaContainer(imageNode, root) {
    let current = imageNode;

    while (current && current !== root && current !== document.body) {
        if (looksLikeMessageContainer(current)) {
            return current;
        }

        current = current.parentElement || current.parentNode;
    }

    return imageNode.parentElement;
}

function looksLikeMessageContainer(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
        return false;
    }

    const tokens = [
        node.className || "",
        node.getAttribute("data-message-id") || "",
        node.getAttribute("data-testid") || "",
        node.getAttribute("aria-label") || "",
        node.getAttribute("role") || ""
    ].join(" ").toLowerCase();

    if (/message|article|response|bot|agent/.test(tokens)) {
        return true;
    }

    const style = window.getComputedStyle(node);
    return parseFloat(style.paddingLeft) > 0 || parseFloat(style.paddingRight) > 0 || style.borderRadius !== "0px";
}

function stylePersonaContainer(container, imageNode, personaType) {
    let current = container;
    let depth = 0;

    imageNode.dataset.artemisPersonaStyled = personaType;
    imageNode.style.display = "block";
    imageNode.style.maxWidth = "100%";
    imageNode.style.height = "28px";
    imageNode.style.width = "auto";
    imageNode.style.filter = `blur(${PERSONA_SOFT_BLUR})`;
    imageNode.style.opacity = PERSONA_OPACITY;

    if (personaType === "user") {
        imageNode.style.marginLeft = "250px";
        imageNode.style.marginRight = "-14px";
        imageNode.style.marginTop = "-6px";
        imageNode.style.marginBottom = "0px";
    }

    while (current && current !== document.body && depth < 3) {
        current.dataset.artemisPersonaStyled = personaType;
        current.style.background = "transparent";
        current.style.backgroundColor = "transparent";
        current.style.boxShadow = "none";
        current.style.border = "0";
        current.style.outline = "0";
        current.style.padding = "0";

        if (depth === 0) {
            current.style.marginBottom = PERSONA_VERTICAL_PULL;
            if (personaType === "user") {
                current.style.marginLeft = "250px";
                current.style.marginRight = "-14px";
                current.style.marginTop = "-6px";
                current.style.marginBottom = "0px";
                current.style.textAlign = "right";
            }
        }
        
        
        if (personaType === "user") {
            current.style.display = "flex";
            current.style.width = "100%";
            current.style.maxWidth = "100%";
            current.style.justifyContent = "flex-end";
            current.style.marginLeft = "250px";
            current.style.marginRight = "-14px";
            current.style.marginTop = "-6px";
            current.style.marginBottom = "0px";
            current.style.alignSelf = "flex-end";
            current.style.justifySelf = "end";
            current.style.textAlign = "right";
            current.style.float = "none";
        } else {
            current.style.display = depth === 0 ? "block" : "flex";
            current.style.width = depth === 0 ? "fit-content" : "100%";
            current.style.maxWidth = "100%";
            current.style.justifyContent = "flex-start";
            current.style.marginTop = "0px";
            current.style.marginBottom = "-4px";
            current.style.marginLeft = "0px";
            current.style.marginRight = "auto";
        }

        const tokens = [
            current.className || "",
            current.getAttribute("role") || "",
            current.getAttribute("data-testid") || ""
        ].join(" ").toLowerCase();

        if (/chat|window|list|panel|container/.test(tokens) && depth > 0) {
            break;
        }

        current = current.parentElement;
        depth += 1;
    }
}

function escapeXml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
