(function(module) {
  var patches = [];
  var lastTap = {};

  var ReactAPI = vendetta.metro.findByProps("addReaction", "removeReaction");
  if (!ReactAPI) {
    vendetta.ui.toasts.showToast("Double Tap React: Could not find reaction API");
  }

  function tryFindTarget() {
    var checks = [
      function() { return vendetta.metro.findByProps("onPress", "onLongPress"); },
      function() { return vendetta.metro.findByProps("onPress", "onLongPress", "dismissable"); },
      function() { return vendetta.metro.findByDisplayName("Message"); },
      function() { return vendetta.metro.findByDisplayName("ChatMessage"); },
      function() { return vendetta.metro.findByDisplayName("MessageComponent"); },
      function() { return vendetta.metro.findByDisplayName("MessageContainer"); },
    ];
    for (var i = 0; i < checks.length; i++) {
      var result = checks[i]();
      if (result && typeof result === "object" && typeof result.onPress === "function") {
        return result;
      }
    }
    var all = vendetta.metro.findByPropsAll("onPress");
    if (all && all.length > 0) {
      for (var j = 0; j < all.length; j++) {
        var fn = all[j].onPress;
        if (typeof fn === "function") {
          try {
            var src = fn.toString();
            if (src.indexOf("channel") > -1 || src.indexOf("message") > -1) {
              return all[j];
            }
          } catch (_) {}
        }
      }
    }
    return null;
  }

  function extractMessage(args) {
    var raw = args[0];
    if (!raw) return null;
    if (raw.message && raw.message.id) return raw.message;
    if (raw.item && raw.item.id) return raw.item;
    if (raw.channel_id && raw.id) return raw;
    if (raw.row && raw.row.id) return raw.row;
    return null;
  }

  var C = {
    onLoad: function() {
      if (!ReactAPI) return;

      var target = tryFindTarget();
      if (!target) {
        vendetta.ui.toasts.showToast("Double Tap React: Could not find message component");
        return;
      }

      var unpatch = vendetta.patcher.after("onPress", target, function(args) {
        var message = extractMessage(args);
        if (!message || !message.id || !message.channel_id) return;

        var now = Date.now();
        if (lastTap[message.id] && now - lastTap[message.id] < 300) {
          delete lastTap[message.id];
          ReactAPI.addReaction(message.channel_id, message.id, { id: null, name: "\u2764\uFE0F" });
        }
        lastTap[message.id] = now;
      });

      patches.push(unpatch);
      vendetta.ui.toasts.showToast("Double Tap React loaded");
    },

    onUnload: function() {
      for (var i = 0; i < patches.length; i++) {
        if (patches[i]) patches[i]();
      }
      patches.length = 0;
      lastTap = {};
    }
  };

  module.default = C;
  Object.defineProperty(module, "__esModule", { value: true });
  return module;
})({});
