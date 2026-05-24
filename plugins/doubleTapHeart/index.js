import { after } from "@vendetta/patcher";
import { findByProps, findByDisplayName, findByPropsAll } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const patches = [];
let lastTap = {};

function tryFindTarget() {
  const checks = [
    () => findByProps("onPress", "onLongPress"),
    () => findByProps("onPress", "onLongPress", "dismissable"),
    () => findByDisplayName("Message"),
    () => findByDisplayName("ChatMessage"),
    () => findByDisplayName("MessageComponent"),
    () => findByDisplayName("MessageContainer"),
  ];
  for (const check of checks) {
    const result = check();
    if (result && typeof result === "object" && typeof result.onPress === "function") {
      return result;
    }
  }
  const all = findByPropsAll("onPress");
  if (all) {
    for (const mod of all) {
      if (typeof mod.onPress === "function") {
        try {
          if (mod.onPress.toString().includes("channel") || mod.onPress.toString().includes("message")) {
            return mod;
          }
        } catch (_) {}
      }
    }
  }
  return null;
}

function extractMessage(args) {
  const raw = args[0];
  if (!raw) return null;
  if (raw.message?.id) return raw.message;
  if (raw.item?.id) return raw.item;
  if (raw.channel_id && raw.id) return raw;
  if (raw.row?.id) return raw.row;
  return null;
}

export default {
  onLoad() {
    const ReactAPI = findByProps("addReaction", "removeReaction");
    if (!ReactAPI) {
      showToast("Double Tap React: Could not find reaction API");
      return;
    }

    const target = tryFindTarget();
    if (!target) {
      showToast("Double Tap React: Could not find message component");
      return;
    }

    patches.push(
      after("onPress", target, (args) => {
        const message = extractMessage(args);
        if (!message || !message.id || !message.channel_id) return;

        const now = Date.now();
        if (lastTap[message.id] && now - lastTap[message.id] < 300) {
          delete lastTap[message.id];
          ReactAPI.addReaction(message.channel_id, message.id, { id: null, name: "\u2764\uFE0F" });
        }
        lastTap[message.id] = now;
      })
    );
  },

  onUnload() {
    for (const p of patches) p();
    patches.length = 0;
    lastTap = {};
  },
};
