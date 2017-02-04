using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Tanks.Models
{
    public class Header
    {
        // username in app
        public string name { get; set; }
        // type of json messgae
        public string type { get; set; }
        public string seqNo { get; set; }
    }
}