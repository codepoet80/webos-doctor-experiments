import Qt 4.7

// webOS CE: a single plain dock-mode clock face -- the time, with the date beneath it,
// centred on the screen. Replaces the stock trio (glass analog / digital flipper / matte
// analog), which were skeuomorphic image-sprite faces.
//
// Everything here comes from the same host API the stock faces use:
//   runtime.twelveHourClock     - the device's 12/24-hour preference
//   runtime.getLocalizedAMPM()  - localized am/pm marker
//   runtime.orientation         - 0/2 portrait, 1/3 landscape (see isLandscape below)
//   Qt.formatDate(d, Qt.DefaultLocaleLongDate) - the locale's own long date form
Item {
    id: simpleclock
    width: 1024; height: 768

    property bool timerRunning: false
    property int isLandscape: (runtime.orientation + 1) % 2

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

    function currentTime() {
        var d = new Date;
        var h = d.getHours();
        if (runtime.twelveHourClock) {
            h = (h % 12 == 0) ? 12 : (h % 12);
        }
        var s = h + ":" + pad(d.getMinutes());
        if (runtime.twelveHourClock) {
            s = s + " " + runtime.getLocalizedAMPM();
        }
        return s;
    }

    function currentDate() {
        return Qt.formatDate(new Date, Qt.DefaultLocaleLongDate);
    }

    property string timeString: currentTime()
    property string dateString: currentDate()

    // The face only resolves to the minute, so one second is ample. The stock clocks polled
    // every 100ms, which is 10x/second of needless work on a screen that sits idle for hours.
    // Re-assigning an identical string is a no-op for QML bindings, so this does not repaint.
    Timer {
        interval: 1000
        running: timerRunning
        repeat: true
        onTriggered: {
            simpleclock.timeString = simpleclock.currentTime();
            simpleclock.dateString = simpleclock.currentDate();
        }
    }

    Column {
        anchors.centerIn: parent
        // nudge up so the time reads as optically centred rather than the block as a whole
        anchors.verticalCenterOffset: -11
        spacing: simpleclock.isLandscape ? 2 : 0

        Text {
            id: timeLabel
            text: simpleclock.timeString
            anchors.horizontalCenter: parent.horizontalCenter
            font.family: "prelude"
            // Sized against the widest realistic string, "12:34 AM" (8 chars), which at
            // 200px measures ~950px -- too wide for a 1024 landscape screen. At these sizes
            // it lands near 845px landscape / 640px portrait, leaving a comfortable margin.
            font.pixelSize: simpleclock.isLandscape ? 178 : 135
            font.weight: Font.Light
            color: "#ffffff"
        }

        Text {
            id: dateLabel
            text: simpleclock.dateString
            anchors.horizontalCenter: parent.horizontalCenter
            font.family: "prelude"
            // headroom for longer localized dates (e.g. "Mittwoch, 19. August 2026")
            font.pixelSize: simpleclock.isLandscape ? 47 : 37
            color: "#b4b4b4"
        }
    }
}
