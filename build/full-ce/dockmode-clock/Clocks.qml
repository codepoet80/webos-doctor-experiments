import Qt 4.7

// webOS CE: the dock-mode Time face.
//
// CE adds SimpleClock as the FIRST entry, so it is what dock mode opens on by default. The
// three stock faces (glass analog, digital flipper, matte analog) are kept and remain
// swipeable behind it -- people who like them still have them.
//
// `mainTimerRunning` is set by LunaSysMgr when the face becomes visible; keep the name.
Rectangle {
    width: 1024
    height: 768
    // Rectangle defaults to white. The stock file never set this and relied on the background
    // image covering the window exactly; anywhere it did not, the gap flashed white.
    color: "black"

    property bool mainTimerRunning: false
    property int isLandscape: (runtime.orientation+1)%2

    Image {
        id: bg
        source: "../../images/dockmode/time/clock_bg.png"
        anchors.fill: parent
        // the asset is 1024x768; crop rather than letterbox so it also covers portrait
        fillMode: Image.PreserveAspectCrop
    }

    VisualItemModel{
        id: clockList
        SimpleClock{timerRunning: mainTimerRunning}
        AnalogClock{glass: 1; timerRunning: mainTimerRunning}
        DigitalClock{timerRunning: mainTimerRunning}
        AnalogClock{glass: 0; timerRunning: mainTimerRunning}
    }

    ListView {
        id: flickable
        anchors.fill: parent
        focus: true
        highlightRangeMode: ListView.StrictlyEnforceRange
        orientation: ListView.Horizontal
        snapMode: ListView.SnapOneItem
        model: clockList
        boundsBehavior: Flickable.DragOverBounds
    }

    // One dot per face, driven off the model rather than hardcoded, so adding or removing a
    // face cannot leave the indicator out of step (stock hardcoded exactly three Images).
    Row {
         spacing: 10
         anchors.centerIn: parent
         anchors.verticalCenterOffset: isLandscape ? 340 : 400
         Repeater {
             model: clockList.count
             Image {
                 source: "../../images/dockmode/time/indicator/"
                         + (flickable.currentIndex == index ? "on" : "off") + ".png"
             }
         }
    }
}
