var ControllerApp = function () {
    var self = this;
    self.ws = {};

    var serverID = "TanksController";

    self.onopen = function () {
        $(".connStatus").html("connected");
    };

    self.onmessage = function (event) 
    {
        var message = JSON.parse(event.data);

        var header = message.header;
        var data = message.data;

        if (header.type == 'handshake')
        {
            var msg = "<li id='" + data.uniqueId + "' class=\"deviceAdm\">"
                + "<input type='checkbox' id='chk" + data.uniqueId + "' class=\"deviceAdmClick\" value='"
                + data.uniqueId + "'";
            
            msg += " checked='true' onclick='return false'";

            msg += ">&nbsp&nbsp" + data.uniqueId + "</input></li>";

            var item = $('#' + data.uniqueId);
            if ($(item).length)
            {
                item.replaceWith(msg);
            }
            else
            {
                $('#devices').find("ul").append(msg);
            }
        };

        if (header.type == 'alarmList')
        {
            var alarm = data.alarms[0];

            // Display alarms
            var cssClass = "alarmOn";
            if (alarm.isActive == false)
            {
                cssClass = "alarmOff";
            }
            else if (alarm.alarmAcknowledged > 0)
            {
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
    };

    self.onerror = function (evt) {
        $(".connStatus").html("connection error");
    };

    self.onclose = function (evt) {
        $(".connStatus").html("disconnected");
    };

    self.init = function () {
        var port = window.location.port;
        if ('WebSocket' in window) {
            self.ws = new WebSocket("ws://" + window.location.hostname + ":" + (port == "" ? "80" : port) + "/Tanks/api/Websocket?id=" + serverID);
        }
        else if ('MozWebSocket' in window) {
            self.ws = new MozWebSocket("ws://" + window.location.hostname + ":" + (port == "" ? "80" : port) + "/api/Websocket?id=" + serverID);
        }
        else {
            return;
        }
        $(".connStatus").html("connecting...");
        self.setupSocketEvents();
        self.setupDomEvents();

    };

    self.send = function (action, sensorID)
    {
        // change sensor color
        if (action == true) {
            var sensor = $('#' + sensorID);
            sensor.removeClass("sensorOff");
            sensor.addClass("sensorOn");
        }
        else if (action == false) {
            var sensor = $('#' + sensorID);
            sensor.removeClass("sensorOn");
            sensor.addClass("sensorOff");
        }

        // send message
        if (self.ws.readyState == WebSocket.OPEN)
        {
            var header = {
                name: serverID,
                type: 'sensor'
            };
            var sensor = {
                sensorName: sensorID,
                isActive: action
            };
            var message = JSON.stringify({
                header: header,
                data: sensor});

            self.ws.send(message);
        }
    };

    self.setupDomEvents = function () {
        $(document.body).delegate("div.sensorOff", "click", function () {
            var sensor = $(this).attr("id");
            self.send(true, sensor);
        });
        $(document.body).delegate("div.sensorOn", "click", function () {
            var sensor = $(this).attr("id");
            self.send(false, sensor);
        });
    };

    self.close = function () {
    };

    self.setupSocketEvents = function () {
        self.ws.onopen = function (evt) { self.onopen(evt); };
        self.ws.onmessage = function (evt) { self.onmessage(evt); };
        self.ws.onerror = function (evt) { self.onerror(evt); };
        self.ws.onclose = function (evt) { self.onclose(evt); };
    };

};


