using Microsoft.Web.WebSockets;
using Tanks.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;

namespace Tanks.Controllers
{
    public class WebSocketController : ApiController
    {
        private static WebSocketCollection connections = new WebSocketCollection();
        
        public HttpResponseMessage Get()
        {
            if (HttpContext.Current.IsWebSocketRequest)
            {
                var shotHandler = new ShotSocketHandler();
                HttpContext.Current.AcceptWebSocketRequest(shotHandler);
            }

            return new HttpResponseMessage(HttpStatusCode.SwitchingProtocols);
        }

        internal class ShotSocketHandler : WebSocketHandler
        {
            public ShotSocketHandler()
            { 
            }

            public override void OnClose()
            {
                connections.Remove(this);
            }

            public override void OnError()
            {
                connections.Remove(this);
            }

            public override void OnOpen()
            {

                Uri uri = this.WebSocketContext.RequestUri;
                string uuid = HttpUtility.ParseQueryString(uri.Query).Get("id");
                
                if (uuid != "")
                {
                    Handshake device = MvcApplication.Devices.Find(element => element.uniqueId == uuid);

                    if (device == null)
                    {
                        device = new Handshake();
                        device.uniqueId = uuid;
                        MvcApplication.Devices.Add(device);
                    }

                    // send connected device to Tank controller
                    string json = new JavaScriptSerializer().Serialize(mapDeviceToMessage(device));
                    foreach (var connection in connections)
                    {
                        string id = HttpUtility.ParseQueryString(connection.WebSocketContext.RequestUri.Query).Get("id");
                        if (id == Constants.serverID)
                        {
                            connection.Send(json);
                            break;
                        }
                    }
                    // add connection to pool
                    connections.Add(this);                    
                }
            }

            public override void OnMessage(string jsonMessage)
            {
                messageHandler(jsonMessage);
            }
        }

        private static Message getPong(string sequenceNunmber)
        {
            // header
            Header header = new Header();
            header.name = Constants.serverID;
            header.type = Constants.DataType.pong.ToString();
            header.seqNo = sequenceNunmber;

            Pong pong = new Pong();
            // message
            Message message = new Message();
            message.header = header;
            message.data = pong;

            return message;
        }

        private static void messageHandler(string message)
        {
            var token = JToken.Parse(message);
            JToken headerToken = token.First;
            JToken dataToken = token.Last;

            string headerString = headerToken.First.ToString();
            Header header = new JavaScriptSerializer().Deserialize<Header>(headerString);
            string dataString = dataToken.First.ToString();

            if (header.type == Constants.DataType.ping.ToString())
            {
                foreach (var connection in connections)
                {
                    Ping ping = new JavaScriptSerializer().Deserialize<Ping>(dataString);

                    string id = HttpUtility.ParseQueryString(connection.WebSocketContext.RequestUri.Query).Get("id");
                    if (id != Constants.serverID)
                    {
                        string json = new JavaScriptSerializer().Serialize(getPong(header.seqNo));
                        connection.Send(json);
                    }
                }
            }
            else if (header.type == Constants.DataType.shot.ToString())
            {
                Shot shot = new JavaScriptSerializer().Deserialize<Shot>(dataString);
                updateGame(shot);
            }
            else if (header.type == Constants.DataType.handshake.ToString())
            {
                Handshake handshake = new JavaScriptSerializer().Deserialize<Handshake>(dataString);
                addPlayer(handshake);
            }
        }

        private static void updateGame(Shot shot)
        {
            throw new NotImplementedException();
        }

        private static void addPlayer(Handshake handshake)
        {
            throw new NotImplementedException();
        }

 /*
        private static void updateSensor(Sensor sensor)
        {
            var alarms = MvcApplication.Alarms;
            var sensors = MvcApplication.Sensors;

            Alarm alarm = alarms.Find(element => element.id == sensors[index].alarmId);

            if (sensor.isActive)
            {
                Alarm alarm = mockAlarm(sensor);

                int index = sensors.FindIndex(element => element.sensorName == sensor.sensorName);
                sensor.alarmId = alarm.id;
                if (index > -1)
                {
                    sensors[index] = sensor;
                }
                else
                {
                    sensors.Add(sensor);
                }
                alarms.Add(alarm);
                return alarm;
            }
            else
            {
                int index = sensors.FindIndex(element => element.sensorName == sensor.sensorName);
                if (index > -1)
                {
                    Alarm alarm = alarms.Find(element => element.id == sensors[index].alarmId);
                    alarm.alarmAcknowledged = Common.ToUnixTime(DateTime.Now);
                    alarm.isActive = false;
                    return alarm;
                }
            }

            return null;
        }

        private static Alarm updateAlarm(AckList ackList, string name)
        {
            var alarms = MvcApplication.Alarms;

            Ack ack = ackList.alarms[0];

            Alarm alarm = alarms.Find(element => element.id == ack.id);
            if (ack.action == Constants.AlarmAction.accept.ToString())
            {
                alarm.alarmAcknowledged = Common.ToUnixTime(DateTime.Now);
                alarm.acknowledgedBy = name;
                int index = alarms.FindIndex(element => element.id == ack.id);
                if (index > -1)
                {
                    alarms[index] = alarm;
                }
            }
            else if (ack.action == Constants.AlarmAction.reject.ToString())
            {
                alarm.alarmAcknowledged = 0;
                int index = alarms.FindIndex(element => element.id == ack.id);
                if (index > -1)
                {
                    alarms[index] = alarm;
                }
            }

            return alarm;
        }
*/

        private static string convertDateToString(DateTime date)
        {
            return date.ToLongTimeString();
        }

        private static void updateDevice(Handshake device)
        {
            var devices = MvcApplication.Devices;

            //TODO: find more sexy way to retrieve device
            foreach (Handshake item in devices)
            {
                if (device.uniqueId == item.uniqueId)
                {
                    int index = devices.IndexOf(item);
                    if (index != -1)
                        devices[index] = device;
                    break;
                }
            }
        }

        public static Message mapDeviceToMessage(Handshake device)
        {
            // header
            Header header = new Header();
            header.name = Constants.serverID;
            header.type = Constants.DataType.handshake.ToString();

            // message
            Message message = new Message();
            message.header = header;
            message.data = device;

            return message;
        }

    }
}
