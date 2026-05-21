import { after } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";

const patches: (() => void)[] = [];

export default {
  onLoad() {
    // Find the module that handles adding reactions via REST
    const ReactAPI = findByProps("addReaction", "removeReaction");

    if (!ReactAPI) {
      showToast("Double Tap React: Could not find reaction API ❌");
      return;
    }

    // Find the message component that handles tap events
    // Discord internally calls handleDoubleTap on message press
    const MessageComponent =
      findByProps("handleDoubleTap", "handleLongPress") ??
      findByProps("onDoubleTap", "onLongPress");

    if (!MessageComponent) {
      showToast("Double Tap React: Could not find message tap handler ❌");
      return;
    }

    const tapMethod =
      "handleDoubleTap" in MessageComponent
        ? "handleDoubleTap"
        : "onDoubleTap";

    patches.push(
      after(tapMethod, MessageComponent, (args) => {
        try {
          // args[0] is typically the message object or an event containing it
          const raw = args[0];
          const message = raw?.message ?? raw;

          if (!message?.id || !message?.channel_id) return;

          ReactAPI.addReaction(
            message.channel_id,
            message.id,
            { id: null, name: "❤️" } // null id = unicode emoji
          );
        } catch (e) {
          console.error("[DoubleTapReact] Failed to react:", e);
        }
      })
    );

    showToast("Double Tap React loaded ❤️");
  },

  onUnload() {
    patches.forEach((p) => p());
    patches.length = 0;
  },
};
