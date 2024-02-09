import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
} from "frames.js/next/server";
import Link from "next/link";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import { getTokenUrl } from "frames.js";
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';


type State = {
  offset: number;
};

const initialState = { offset: 0 };

const reducer: FrameReducer<State> = (state, action) => {
  return {
    offset: state.offset + 1,
  };
};

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...DEBUG_HUB_OPTIONS,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  if (frameMessage) {
    const {
      buttonIndex,
    } = frameMessage;
    if (buttonIndex === 1) {
      state.offset = state.offset - 2;
      if (state.offset < 0) {
        state.offset = 0;
      }
    }
  }

  const GET_DATA_QUERY = gql`
  {
    inscription(
      order_by: {
        id: asc
      }
      limit: 1, 
      offset:${state.offset}) 
    {
      id
      name:metadata(path: "$.metadata.name")
      mime:metadata(path: "$.metadata.mime")
      content_path
      transaction {
        hash
      }
    }
  }
`;

  console.log("LOAD USER'S FIRST LISTED INSCRIPTION");
  // Query graphql server with the following query

  const client = new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.asteroidprotocol.io/v1/graphql', // Replace this with your GraphQL server URI
    }),
    cache: new InMemoryCache(),
  });
  const result = await client.query({
    query: GET_DATA_QUERY,
  });

  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  // Not an image, don't try to render it
  if (!result.data.inscription[0].mime.startsWith("image")) {
    return (
      <div className="p-4">
        frames.js starter kit.{" "}
        <Link href={`/debug?url=${baseUrl}`} className="underline">
          Debug
        </Link>
        <FrameContainer
          postUrl="/frames"
          state={state}
          previousFrame={previousFrame}
          pathname="/"
        >
          <FrameImage>
            <img style={{ position: "absolute", top: "0px", left: "0px" }} width="100%" height="100%" src="http://localhost:3000/content/framebg.png" />
            <div style={{ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", opacity: "0.3", backgroundColor: "#000000" }} />
            <div style={{ display: "flex", position: "absolute", top: "0px", left: "0px", color: "#fff", width: "100%", justifyContent: 'center' }}>
              <div style={{ display: "flex", position: "absolute", top: "100px", left: "0px", color: "#fff", width: "100%", justifyContent: 'center' }}>
                {result.data.inscription[0].mime} can't be displayed
              </div>
              <div style={{ display: "flex", position: "absolute", top: "360px", left: "0px", color: "#fff", width: "100%", justifyContent: 'center' }}>
                <h1>{result.data.inscription[0].name}</h1>
              </div>
              <div style={{ display: "flex", position: "relative", top: "480px", left: "0px", color: "#aaa", width: "100%", justifyContent: 'center' }}>
                <p>Inscription #{result.data.inscription[0].id}</p>
              </div>
            </div>
          </FrameImage>
          <FrameButton onClick={dispatch}>
            Previous
          </FrameButton>
          <FrameButton href={`https://asteroidprotocol.io/app/inscription/${result.data.inscription[0].transaction.hash}`}>On Asteroids</FrameButton>
          <FrameButton onClick={dispatch}>
            Next
          </FrameButton>
        </FrameContainer>
      </div>
    );
  }

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit.{" "}
      <Link href={`/debug?url=${baseUrl}`} className="underline">
        Debug
      </Link>
      <FrameContainer
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
        pathname="/"
      >
        {/* <FrameImage src="https://framesjs.org/og.png" /> */}
        <FrameImage>
          <img style={{ position: "absolute", top: "0px", left: "0px" }} width="100%" height="100%" src="http://localhost:3000/content/framebg.png" />
          <div style={{ position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%", opacity: "0.3", backgroundColor: "#000000" }} />
          <div style={{ display: "flex", position: "absolute", top: "0px", left: "0px", color: "#fff", textAlign: "center" }}>
            <img style={{ position: "absolute", top: "40px", left: "400px", borderRadius: "10px" }} width={350} height={350} src={result.data.inscription[0].content_path} />
            <div style={{ display: "flex", position: "absolute", top: "360px", left: "0px", color: "#fff", width: "100%", justifyContent: 'center' }}>
              <h1>{result.data.inscription[0].name}</h1>
            </div>
            <div style={{ display: "flex", position: "relative", top: "480px", left: "0px", color: "#aaa", width: "100%", justifyContent: 'center' }}>
              <p>Inscription #{result.data.inscription[0].id}</p>
            </div>
          </div>
        </FrameImage>
        <FrameButton onClick={dispatch}>
          Previous
        </FrameButton>
        <FrameButton href={`https://asteroidprotocol.io/app/inscription/${result.data.inscription[0].transaction.hash}`}>On Asteroids</FrameButton>
        <FrameButton onClick={dispatch}>
          Next
        </FrameButton>
      </FrameContainer>
    </div >
  );
}
