({
  onLoad: function() {
    console.log("DTReact: onLoad started");
    var ReactAPI = vendetta.metro.findByProps("addReaction", "removeReaction");
    if (!ReactAPI) {
      console.log("DTReact: no ReactAPI found");
      return;
    }
    console.log("DTReact: ReactAPI found");
    var target = vendetta.metro.findByProps("onPress", "onLongPress");
    if (!target) {
      console.log("DTReact: no target found");
      return;
    }
    console.log("DTReact: target found, patching");
    var unpatch = vendetta.patcher.after("onPress", target, function(args) {
      console.log("DTReact: onPress fired", args[0]);
    });
    this.unpatch = unpatch;
    console.log("DTReact: plugin ready");
  },
  onUnload: function() {
    if (this.unpatch) this.unpatch();
    console.log("DTReact: unloaded");
  }
})
