/* eslint-disable react/prop-types */
import {Copy, Download, LinkIcon, Trash} from "lucide-react";
import {Link} from "react-router-dom";
import {Button} from "./ui/button";
import useFetch from "@/hooks/use-fetch";
import {deleteUrl} from "@/db/apiUrls";
import {BeatLoader} from "react-spinners";

const LinkCard = ({url = [], fetchUrls}) => {
  const downloadImage = () => {
    const imageUrl = url?.qr;
    const fileName = url?.title; // Desired file name for the downloaded image

    // Create an anchor element
    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = fileName;

    // Append the anchor to the body
    document.body.appendChild(anchor);

    // Trigger the download by simulating a click event
    anchor.click();

    // Remove the anchor from the document
    document.body.removeChild(anchor);
  };

  const {loading: loadingDelete, fn: fnDelete} = useFetch(deleteUrl, url.id);

  return (
    <div className="flex flex-col md:flex-row gap-5 border p-4 rounded-lg">
      <img
        src={url?.qr}
        className="h-24 w-24 object-contain ring ring-[#7f57f1] self-start mt-2"
        alt="qr code"
      />
      <Link to={`/link/${url?.id}`} className="flex flex-col flex-1">
        <div className="flex flex-col ">
          <span className="text-3xl font-extrabold cursor-pointer">
            {url?.title}
          </span>
          <span className="text-2xl text-[#7f57f1] font-bold hover:underline cursor-pointer">
            https://trimrr.in/{url?.custom_url ? url?.custom_url : url.short_url}
          </span>
          <span className="flex items-center gap-1 hover:underline cursor-pointer">
            {url?.original_url}
          </span>

          <span className="flex items-end font-extralight text-sm flex-1">
            {new Date(url?.created_at).toLocaleString()}
          </span>
        </div>
      </Link>
      <div className="flex gap-2">
        <button
          className="bg-white hover:bg-white"
          onClick={() =>
            navigator.clipboard.writeText(`https://trimrr.in/${url?.short_url}`)
          }
        >
          <Copy />
        </button>
        <button onClick={downloadImage}>
          <Download />
        </button>
        <Button
          onClick={() => fnDelete().then(() => fetchUrls())}
          className="bg-white hover:bg-white"
          disable={loadingDelete}
        >
          {loadingDelete ? <BeatLoader size={5} color="white" /> : <Trash />}
        </Button>
      </div>
    </div>
  );
};

export default LinkCard;
