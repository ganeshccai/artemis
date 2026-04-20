let personaRefreshTimer = null;
let personaSequence = 0;
let lastUserPersonaRenderAt = 0;
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
const CONTACT_FORM_OPEN_ACTION = "open_form";
const CONTACT_FORM_TYPE = "contact_form";
const CONTACT_FORM_ENDPOINT = "/contact-form-submissions";
const CONTACT_FORM_DEFAULT_CONFIG = {
    title: "Contact Form",
    subtitle: "Please enter your details",
    submitLabel: "Submit"
};

window.addEventListener("DOMContentLoaded", () => {
    initializeContactForm();

    setTimeout(() => {
        const df = document.createElement("df-messenger");
        df.setAttribute("project-id", "project001-474715");
        df.setAttribute("location", "us-central1");
        df.setAttribute("agent-id", "57dcbcf5-05fd-4556-90d4-3438bc6c28d9");
        df.setAttribute("language-code", "en");
        df.setAttribute("max-query-length", "-1");
        df.setAttribute("url-allowlist", "*");
        df.setAttribute("storage-option", "none");

        const bubble = document.createElement("df-messenger-chat-bubble");
        bubble.setAttribute("chat-icon", "https://mohanjichronicles.files.wordpress.com/2018/02/lord-hanuman-miracles.jpg");
        bubble.setAttribute("chat-title-icon", "https://mohanjichronicles.files.wordpress.com/2018/02/lord-hanuman-miracles.jpg");
        bubble.setAttribute("chat-title", "Artemis_Hospital");
        bubble.setAttribute("chat-subtitle", "🟢 Online");

        df.appendChild(bubble);
        document.body.appendChild(df);

        ensureCircularBubbleIcon(df);
        autoOpenChatWindow(df, bubble, CHAT_AUTO_OPEN_DELAY_MS);
        attachPersonaHandlers(df);
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
        if (bubbleNode) {
            bubbleNode.setAttribute("expand", "true");
            if ("expand" in bubbleNode) {
                bubbleNode.expand = true;
            }
        }

        if (dfMessenger) {
            dfMessenger.setAttribute("expand", "true");
            if ("expand" in dfMessenger) {
                dfMessenger.expand = true;
            }
        }

        tryOpenChatByClick(dfMessenger);
    }, delayMs);
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

        const contactFormConfig = getContactFormConfig(event);

        if (contactFormConfig) {
            openContactForm(contactFormConfig);
        }

        if (messages.length > 0) {
            renderPersona(dfMessenger, "bot", "Bot 🤖");
        }
    });
}

function initializeContactForm() {
    const contactFormFields = document.getElementById("contact-form-fields");
    const closeButton = document.getElementById("contact-form-close");

    if (contactFormFields) {
        contactFormFields.addEventListener("submit", submitContactForm);
    }

    if (closeButton) {
        closeButton.addEventListener("click", closeContactForm);
    }
}

function getContactFormConfig(event) {
    const responseMessages = event && event.detail && event.detail.raw && event.detail.raw.queryResult
        && Array.isArray(event.detail.raw.queryResult.responseMessages)
        ? event.detail.raw.queryResult.responseMessages
        : [];

    const messengerMessages = event && event.detail && event.detail.data && Array.isArray(event.detail.data.messages)
        ? event.detail.data.messages
        : [];

    const matchingMessage = [...responseMessages, ...messengerMessages].find(messageContainsContactFormPayload);
    return matchingMessage ? buildContactFormConfig(matchingMessage) : null;
}

function messageContainsContactFormPayload(message) {
    const payload = extractMessagePayload(message);
    if (!payload) {
        return false;
    }

    return payload.action === CONTACT_FORM_OPEN_ACTION || payload.type === CONTACT_FORM_TYPE;
}

function buildContactFormConfig(message) {
    const payload = extractMessagePayload(message) || {};

    return {
        title: normalizeContactFormText(payload.title, CONTACT_FORM_DEFAULT_CONFIG.title),
        subtitle: normalizeContactFormText(payload.subtitle, CONTACT_FORM_DEFAULT_CONFIG.subtitle),
        submitLabel: normalizeContactFormText(payload.submitLabel, CONTACT_FORM_DEFAULT_CONFIG.submitLabel)
    };
}

function extractMessagePayload(message) {
    if (!message || typeof message !== "object" || !message.payload) {
        return null;
    }

    if (looksLikePlainPayload(message.payload)) {
        return message.payload;
    }

    if (message.payload.fields) {
        return convertStructFieldsToObject(message.payload.fields);
    }

    return null;
}

function looksLikePlainPayload(payload) {
    return typeof payload.action === "string"
        || typeof payload.type === "string"
        || typeof payload.title === "string"
        || typeof payload.subtitle === "string"
        || typeof payload.submitLabel === "string";
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

    if (Object.prototype.hasOwnProperty.call(value, "nullValue")) {
        return null;
    }

    return value;
}

function normalizeContactFormText(value, fallbackValue) {
    return typeof value === "string" && value.trim() ? value.trim() : fallbackValue;
}

function openContactForm(config = CONTACT_FORM_DEFAULT_CONFIG) {
    const contactForm = document.getElementById("contact-form");
    const titleElement = document.getElementById("contact-form-title");
    const subtitleElement = document.getElementById("contact-form-subtitle");
    const submitButton = document.getElementById("contact-form-submit");
    const statusElement = document.getElementById("contact-form-status");

    if (!contactForm) {
        return;
    }

    if (titleElement) {
        titleElement.textContent = config.title;
    }

    if (subtitleElement) {
        subtitleElement.textContent = config.subtitle;
    }

    if (submitButton) {
        submitButton.textContent = config.submitLabel;
    }

    if (statusElement) {
        statusElement.textContent = "";
        statusElement.classList.remove("is-success", "is-error");
    }

    contactForm.classList.add("is-open");
    contactForm.setAttribute("aria-hidden", "false");
}

function closeContactForm() {
    const contactForm = document.getElementById("contact-form");

    if (!contactForm) {
        return;
    }

    contactForm.classList.remove("is-open");
    contactForm.setAttribute("aria-hidden", "true");
}

function submitContactForm(event) {
    event.preventDefault();

    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const mobileInput = document.getElementById("contact-mobile");
    const messageInput = document.getElementById("contact-message");
    const submitButton = document.getElementById("contact-form-submit");
    const statusElement = document.getElementById("contact-form-status");

    const formData = {
        name: nameInput ? nameInput.value.trim() : "",
        email: emailInput ? emailInput.value.trim() : "",
        mobile: mobileInput ? mobileInput.value.trim() : "",
        message: messageInput ? messageInput.value.trim() : ""
    };

    if (statusElement) {
        statusElement.textContent = "Submitting...";
        statusElement.classList.remove("is-success", "is-error");
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
        .then(async (response) => {
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload.error || "Unable to submit the form.");
            }

            if (statusElement) {
                statusElement.textContent = payload.message || "Submitted successfully.";
                statusElement.classList.add("is-success");
                statusElement.classList.remove("is-error");
            }

            if (nameInput) {
                nameInput.value = "";
            }

            if (emailInput) {
                emailInput.value = "";
            }

            if (mobileInput) {
                mobileInput.value = "";
            }

            if (messageInput) {
                messageInput.value = "";
            }
        })
        .catch((error) => {
            if (statusElement) {
                statusElement.textContent = error.message || "Submission failed. Please try again.";
                statusElement.classList.add("is-error");
                statusElement.classList.remove("is-success");
            }
        })
        .finally(() => {
            if (submitButton) {
                submitButton.disabled = false;
            }
        });
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
