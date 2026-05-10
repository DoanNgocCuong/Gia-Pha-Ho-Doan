/**
 * @module tree-shell-config
 * @description Load `data/tree-shell-config.json` and apply rail / tree-stage layout as :root CSS variables.
 * Falls back to built-in defaults if the file is missing or invalid.
 */

const DEFAULTS = {
    rails: { leftRem: 5.35, rightRem: 10.75 },
    stage: {
        padding: '12px 32px',
        borderColor: '#c8c8c6',
        borderWidthPx: 2,
        borderRadiusPx: 10,
        boxShadow: '0 1px 6px rgba(0, 0, 0, 0.06)',
        backgroundGradientTop: '#fafafa',
        backgroundGradientBottom: '#f3f3f2'
    },
    railsCommon: {
        background: 'rgba(255, 255, 255, 0.4)',
        separatorColor: '#dededd',
        separatorWidthPx: 1
    }
};

/**
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
function finiteNumberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {*} value
 * @param {string} fallback
 * @returns {string}
 */
function nonEmptyStringOr(value, fallback) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return fallback;
}

/**
 * Merge raw JSON into safe shell config.
 * @param {object|null|undefined} raw
 * @returns {typeof DEFAULTS}
 */
function normalizeShellConfig(raw) {
    const d = DEFAULTS;
    const r = raw && typeof raw === 'object' ? raw : {};
    const rails = r.rails && typeof r.rails === 'object' ? r.rails : {};
    const stage = r.stage && typeof r.stage === 'object' ? r.stage : {};
    const com   = r.railsCommon && typeof r.railsCommon === 'object' ? r.railsCommon : {};

    return {
        rails: {
            leftRem:  finiteNumberOr(rails.leftRem,  d.rails.leftRem),
            rightRem: finiteNumberOr(rails.rightRem, d.rails.rightRem)
        },
        stage: {
            padding: nonEmptyStringOr(stage.padding, d.stage.padding),
            borderColor: nonEmptyStringOr(stage.borderColor, d.stage.borderColor),
            borderWidthPx: finiteNumberOr(stage.borderWidthPx, d.stage.borderWidthPx),
            borderRadiusPx: finiteNumberOr(stage.borderRadiusPx, d.stage.borderRadiusPx),
            boxShadow: nonEmptyStringOr(stage.boxShadow, d.stage.boxShadow),
            backgroundGradientTop: nonEmptyStringOr(stage.backgroundGradientTop, d.stage.backgroundGradientTop),
            backgroundGradientBottom: nonEmptyStringOr(stage.backgroundGradientBottom, d.stage.backgroundGradientBottom)
        },
        railsCommon: {
            background: nonEmptyStringOr(com.background, d.railsCommon.background),
            separatorColor: nonEmptyStringOr(com.separatorColor, d.railsCommon.separatorColor),
            separatorWidthPx: finiteNumberOr(com.separatorWidthPx, d.railsCommon.separatorWidthPx)
        }
    };
}

/**
 * Fetch and normalize tree shell layout config.
 * @returns {Promise<typeof DEFAULTS>}
 */
export async function loadTreeShellConfig() {
    try {
        const response = await fetch('./data/tree-shell-config.json', { cache: 'no-store' });
        if (!response.ok) {
            console.warn('Không đọc được tree-shell-config.json, dùng mặc định.');
            return normalizeShellConfig(null);
        }
        const raw = await response.json();
        return normalizeShellConfig(raw);
    } catch (e) {
        console.warn('Lỗi tải tree-shell-config.json, dùng mặc định.', e);
        return normalizeShellConfig(null);
    }
}

/**
 * Apply shell config to :root custom properties (used by index.html CSS).
 * @param {ReturnType<typeof normalizeShellConfig>} shell
 */
export function applyTreeShellConfigToCss(shell) {
    const root = document.documentElement;
    const w    = shell.railsCommon.separatorWidthPx;
    const c    = shell.railsCommon.separatorColor;

    root.style.setProperty('--tree-rail-left-width', shell.rails.leftRem + 'rem');
    root.style.setProperty('--tree-rail-right-width', shell.rails.rightRem + 'rem');
    root.style.setProperty('--tree-shell-stage-padding', shell.stage.padding);
    root.style.setProperty('--tree-shell-border', shell.stage.borderWidthPx + 'px solid ' + shell.stage.borderColor);
    root.style.setProperty('--tree-shell-border-radius', shell.stage.borderRadiusPx + 'px');
    root.style.setProperty('--tree-shell-shadow', shell.stage.boxShadow);
    root.style.setProperty('--tree-shell-bg-top', shell.stage.backgroundGradientTop);
    root.style.setProperty('--tree-shell-bg-bottom', shell.stage.backgroundGradientBottom);
    root.style.setProperty('--tree-rail-bg', shell.railsCommon.background);
    root.style.setProperty('--tree-rail-left-border', w + 'px solid ' + c);
    root.style.setProperty('--tree-rail-right-border', w + 'px solid ' + c);
}
