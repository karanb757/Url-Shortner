// import {Button} from "@/components/ui/button";
// import {Input} from "@/components/ui/input";
// import {useState} from "react";
// import {useNavigate} from "react-router-dom";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import 



// const LandingPage = () => {
//   const [longUrl, setLongUrl] = useState("");
//   const navigate = useNavigate();

//   const handleShorten = (e) => {
//     e.preventDefault();
//     if (longUrl) navigate(`/auth?createNew=${longUrl}`);
//   };

//   return (
//     <div className="flex flex-col items-center">
//       <h2 className="my-10 sm:my-16 text-3xl sm:text-6xl lg:text-7xl text-[#111828] text-center font-extrabold ">
//       Got a boring long URL  ?<br /> 
//         <span className="block mt-4 text-[#7F57F1]">Let&apos;s shrink it!</span>
//       </h2>

//       <div className="pl-52 pb-6">
//       <Tabs defaultValue="account" className="w-[400px]">
//       <TabsList>
//         <TabsTrigger value="account">Shorten URL</TabsTrigger>
//         <TabsTrigger value="password">Generate QR</TabsTrigger>
//       </TabsList>
//       </Tabs>
//       </div>

//       <form
//         onSubmit={handleShorten}
//         className="sm:h-14 flex flex-col sm:flex-row w-full md:w-2/4 gap-2"
//       >
//         <Input
//           type="url"
//           placeholder="Enter URL "
//           value={longUrl}
//           onChange={(e) => setLongUrl(e.target.value)}
//           className="h-full flex-1 py-4 px-4 bg-white "
//         />
//         <Button type="submit" className="h-full bg-[#7F57F1] ml-2" variant="destructive">
//           Shorten
//         </Button>
//       </form>
//       <Accordion type="multiple" collapsible className="w-full md:px-11 mt-80">
//         <AccordionItem value="item-1">
//           <AccordionTrigger>
//             How does the Trimrr URL shortener works?
//           </AccordionTrigger>
//           <AccordionContent>
//             When you enter a long URL, our system generates a shorter version of
//             that URL. This shortened URL redirects to the original long URL when
//             accessed.
//           </AccordionContent>
//         </AccordionItem>
//         <AccordionItem value="item-2">
//           <AccordionTrigger>
//             Do I need an account to use the app?
//           </AccordionTrigger>
//           <AccordionContent>
//             Yes. Creating an account allows you to manage your URLs, view
//             analytics, and customize your short URLs.
//           </AccordionContent>
//         </AccordionItem>
//         <AccordionItem value="item-3">
//           <AccordionTrigger>
//             What analytics are available for my shortened URLs?
//           </AccordionTrigger>
//           <AccordionContent>
//             You can view the number of clicks, geolocation data of the clicks
//             and device types (mobile/desktop) for each of your shortened URLs.
//           </AccordionContent>
//         </AccordionItem>
//       </Accordion>
//     </div>
//   );
// };

// export default LandingPage;


import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {QRCode} from "react-qrcode-logo";
import {Copy, Download, X} from "lucide-react";
import * as yup from "yup";
import useFetch from "@/hooks/use-fetch";
import {createUrl} from "@/db/apiUrls";
import {BeatLoader} from "react-spinners";
import {UrlState} from "@/context";
import Error from "@/components/error";

const LandingPage = () => {
  const [longUrl, setLongUrl] = useState("");
  const [activeTab, setActiveTab] = useState("shorten");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);
  const [errors, setErrors] = useState({});
  
  const navigate = useNavigate();
  const qrRef = useRef();
  const {user, isAuthenticated} = UrlState();

  // Schema for validation
  const shortenSchema = yup.object().shape({
    longUrl: yup
      .string()
      .url("Must be a valid URL")
      .required("URL is required"),
  });

  const qrSchema = yup.object().shape({
    longUrl: yup
      .string()
      .url("Must be a valid URL")
      .required("URL is required"),
  });

  // Fetch hook for creating URL
  const {
    loading,
    error,
    data,
    fn: fnCreateUrl,
  } = useFetch(createUrl, {
    title: `Link created on ${new Date().toLocaleDateString()}`,
    longUrl: longUrl,
    customUrl: "",
    user_id: user?.id,
  });

  // Handle successful URL creation
  useEffect(() => {
    if (error === null && data) {
      setGeneratedData(data[0]);
      setShowSuccessDialog(true);
    }
  }, [error, data]);

  const handleShorten = async (e) => {
    e.preventDefault();
    setErrors({});

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate(`/auth?createNew=${longUrl}`);
      return;
    }

    try {
      await shortenSchema.validate({longUrl}, {abortEarly: false});

      // Create QR code blob
      const canvas = qrRef.current.canvasRef.current;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve));

      // Call API to create URL
      await fnCreateUrl(blob);
    } catch (e) {
      const newErrors = {};
      e?.inner?.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      await qrSchema.validate({longUrl}, {abortEarly: false});
      
      // For QR only, just show the dialog with QR code
      setGeneratedData({qr: longUrl, original_url: longUrl});
      setShowSuccessDialog(true);
    } catch (e) {
      const newErrors = {};
      e?.inner?.forEach((err) => {
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleCopyLink = () => {
    const link = generatedData?.custom_url 
      ? `https://trimrr.in/${generatedData.custom_url}`
      : `https://trimrr.in/${generatedData?.short_url}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.canvasRef?.current;
    if (canvas) {
      const url = canvas.toDataURL();
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = url;
      link.click();
    }
  };

  const shareToSocial = (platform) => {
    const link = generatedData?.custom_url 
      ? `https://trimrr.in/${generatedData.custom_url}`
      : `https://trimrr.in/${generatedData?.short_url}`;
    const url = encodeURIComponent(link);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}`,
      email: `mailto:?subject=Check this link&body=${url}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  return (
    <div className="relative flex flex-col items-center w-full">

        {/* Background illustration */}
        {/* <img
          src="/men.svg"
          alt="Illustration"
          className="absolute h-[280px] w-[360px] pointer-events-none object-contain bottom-[400px] left-0"
        /> */}

      <h2 className="my-10 sm:my-16 text-3xl sm:text-6xl lg:text-7xl text-[#111828] text-center font-extrabold">
        Got a boring long URL?
        <br />
        <span className="block mt-4 text-[#7F57F1]">Let&apos;s shrink it!</span>
      </h2>

      {/* Hidden QR Code for generation */}
      <div className="hidden">
        <QRCode ref={qrRef} size={250} value={longUrl || "https://example.com"} />
      </div>

      <div className="w-full md:w-2/4 mb-8 z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList>
              <TabsTrigger value="shorten">Shorten URL</TabsTrigger>
              <TabsTrigger value="qr">Generate QR</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shorten">
            <form
              onSubmit={handleShorten}
              className="sm:h-14 flex flex-col sm:flex-row gap-2"
            >
              <Input
                type="url"
                placeholder="Enter your long URL"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="h-full flex-1 py-4 px-4 bg-white"
              />
              <Button
                type="submit"
                className="h-full bg-[#7F57F1]"
                variant="destructive"
                disabled={loading}
              >
                {loading ? <BeatLoader size={8} color="white" /> : "Shorten"}
              </Button>
            </form>
            {errors.longUrl && <Error message={errors.longUrl} />}
            {error && <Error message={error.message} />}
          </TabsContent>

          <TabsContent value="qr">
            <form
              onSubmit={handleGenerateQR}
              className="sm:h-14 flex flex-col sm:flex-row gap-2"
            >
              <Input
                type="url"
                placeholder="Enter URL for QR code"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                className="h-full flex-1 py-4 px-4 bg-white"
              />
              <Button
                type="submit"
                className="h-full bg-[#7F57F1]"
                variant="destructive"
              >
                Generate
              </Button>
            </form>
            {errors.longUrl && <Error message={errors.longUrl} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Dialog Popup */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <button
            onClick={() => setShowSuccessDialog(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {activeTab === "shorten"
                ? "Your link is ready! 🎉"
                : "Your QR code is ready! 🎉"}
            </DialogTitle>
          </DialogHeader>

          {activeTab === "shorten" && generatedData ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm pb-4">
                Copy the link below or choose platform to share it.
              </p>

              <div className="p-4 bg-[#edf2ff] flex flex-col gap-8 rounded-none ">
                <span className="text-xl font-bold text-[#7f57f1] text-center bg-[#edf2ff] mt-4 cursor-pointer">
                  {generatedData?.custom_url
                    ? `trimrr.in/${generatedData.custom_url}`
                    : `trimrr.in/${generatedData?.short_url}`}
                </span>

              <div className="flex gap-2 ">
                <Button
                  onClick={() => {
                    setShowSuccessDialog(false);
                    navigate(`/link/${generatedData.id}`);
                  }}
                  variant="outline"
                  className="flex-1 bg-white boder-2 "
                >
                  📊 View link details
                </Button>
                <Button onClick={handleCopyLink} className="flex-1 bg-white " variant="outline">
                  <Copy size={16} className="mr-2  bg-transparent text-white" />
                  Copy link
                </Button>
              </div>
              </div>

              <div className="py-4">
                <div className="flex gap-6 justify-center flex-wrap">
                  <button
                    onClick={() => shareToSocial("whatsapp")}
                    className="flex flex-col items-center gap-1 hover:opacity-90 transition-opacity"
                    type="button"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      W
                    </div>
                    <span className="text-xs text-gray-600">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => shareToSocial("facebook")}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      f
                    </div>
                    <span className="text-xs text-gray-600">Facebook</span>
                  </button>
                  <button
                    onClick={() => shareToSocial("twitter")}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white text-xl font-bold">
                      𝕏
                    </div>
                    <span className="text-xs text-gray-600">X</span>
                  </button>
                  <button
                    onClick={() => shareToSocial("email")}
                    className="flex flex-col items-center gap-1 hover:opacity-70 transition-opacity"
                    type="button"
                  >
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl">
                      ✉
                    </div>
                    <span className="text-xs text-gray-600">Email</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Scan this QR code to access your link or download it.
              </p>

              <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                <QRCode value={longUrl || "https://example.com"} size={200} />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 text-center break-all">
                  {longUrl}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadQR}
                  className="flex-1 bg-white border-2"
                >
                  <Download size={16} className="mr-2" />
                  Download QR
                </Button>
                <Button
                  onClick={() => setShowSuccessDialog(false)}
                  className="flex-1 bg-white border-2"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Accordion type="multiple" className="w-full md:px-11 mt-80">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            How does the Trimrr URL shortener works?
          </AccordionTrigger>
          <AccordionContent>
            When you enter a long URL, our system generates a shorter version of
            that URL. This shortened URL redirects to the original long URL when
            accessed.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            Do I need an account to use the app?
          </AccordionTrigger>
          <AccordionContent>
            Yes. Creating an account allows you to manage your URLs, view
            analytics, and customize your short URLs.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>
            What analytics are available for my shortened URLs?
          </AccordionTrigger>
          <AccordionContent>
            You can view the number of clicks, geolocation data of the clicks
            and device types (mobile/desktop) for each of your shortened URLs.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default LandingPage;