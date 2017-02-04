var DeviceApp = function () {
    var self = this;
    self.ws = {};

    self.onopen = function () {
        $(".connStatus").html("connected");

        self.sendHandshake();
    };

    self.onmessage = function (event) {

        var message = JSON.parse(event.data);

        var header = message.header;
        var data = message.data;

        // Display alarms
        var login = readCookie('login');
        if (header.type == 'alarmList')
        {
            // loop through and display alarms

            for (var i = 0; i < data.alarms.length; i++) {

                var alarm = data.alarms[i];

                // Display alarms
                var cssClass = "alarmOn";
                if (alarm.isActive == false) {
                    cssClass = "alarmOff";
                }
                else if (alarm.alarmAcknowledged > 0) {
                    cssClass = "alarmAccept";
                }

                var triggered = new Date(0);
                triggered.setSeconds(alarm.alarmTriggered);
                var trgString = triggered.toLocaleTimeString();
                var acknowledged = new Date(0);
                acknowledged.setSeconds(alarm.alarmAcknowledged);
                var ackString = "";
                if (alarm.alarmAcknowledged > 0) ackString = acknowledged.toLocaleTimeString();

                var msg = "<li id='" + alarm.id + "' class='" + cssClass + "'>"
                        + "<div style='font-size: 20px'><b>ALARM " + alarm.id + "</b></div>"
                        + "<div style='font-size: 16px'>" + alarm.alarmText + "</div><br>"
                        + "Utløst: " + trgString + "<br>"
                        + "Kvittert: " + ackString;
                + "</li>";

                var item = $('#' + alarm.id);
                if ($(item).length) {
                    item.replaceWith('<li>' + msg + '</li>');
                }
                else {
                    $('#alarms').find("ul").prepend(msg);
                }
            }
        }
    };

    self.onerror = function (evt) {
        $(".connStatus").html("connection error");
    };

    self.onclose = function (evt) {
        $(".connStatus").html("disconnected");
    };

    self.init = function () {
        var login = readCookie('login');
        var port = window.location.port;
        if ('WebSocket' in window) {
            self.ws = new WebSocket("ws://" + window.location.hostname + ":" + (port == "" ? "80" : port) + "/Tanks/api/Websocket?id=" + login);
        }
        else if ('MozWebSocket' in window) {
            self.ws = new MozWebSocket("ws://" + window.location.hostname + ":" + (port == "" ? "80" : port) + "/api/Websocket?id=" + login);
        }
        else {
            return;
        }
        $(".connStatus").html("connecting...");
        self.setupSocketEvents();
        self.setupDomEvents();
    };

    self.sendAck = function (action, alarmID) {
        if (self.ws.readyState == WebSocket.OPEN) {
            var login = readCookie('login');
            var header = {
                name: login,
                type: 'alarmAction'
            };
            var ack = {
                id: alarmID,
                action: action
            };

            var alarms = { alarms: [ack] };
            var message = JSON.stringify({
                header: header,
                data: alarms
            });
            self.ws.send(message);
        }
    };

    self.sendHandshake = function () {
        if (self.ws.readyState == WebSocket.OPEN) {
            var login = readCookie('login');
            var header = {
                name: login,
                type: 'handshake'
            };
            var handshake = {
                uniqueId: login,
                name : login,
                phoneNumber : 123123,
                notificationUri : ''
            };

            var message = JSON.stringify({
                header: header,
                data: handshake
            });

            self.ws.send(message);
        }
    };


    self.close = function () {
    };

    self.setupDomEvents = function () {
        $(document.body).delegate(".alarmOn", "click", function () {
            var alarm = $(this).attr("id");
            self.sendAck("accept", alarm);
        });
        $(document.body).delegate(".alarmAccept", "click", function () {
            var alarm = $(this).attr("id");
            self.sendAck("reject", alarm);
        });
    };

    self.setupSocketEvents = function () {
        self.ws.onopen = function (evt) { self.onopen(evt); };
        self.ws.onmessage = function (evt) { self.onmessage(evt); };
        self.ws.onerror = function (evt) { self.onerror(evt); };
        self.ws.onclose = function (evt) { self.onclose(evt); };
    };

};

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}