using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Tanks
{
    public class Constants
    {
        public static string serverID = "TanksController";

        public enum DataType
        {
            shot,
            handshake,
            ping,
            pong
        };
    }
}