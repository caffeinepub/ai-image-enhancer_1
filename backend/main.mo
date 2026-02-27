import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Int "mo:core/Int";
import Iter "mo:core/Iter";


actor {
  include MixinStorage();

  type EnhancementMode = {
    #standard;
    #anime;
  };

  type UploadSession = {
    totalChunks : Nat;
    receivedChunks : Map.Map<Nat, [Nat8]>;
    fileType : Text;
  };

  let images = Map.empty<Text, [Nat8]>();
  let uploadSessions = Map.empty<Text, UploadSession>();
  var nextImageId = 0;

  public shared ({ caller }) func initUpload(totalChunks : Nat, fileType : Text) : async Text {
    let sessionId = "Session-" # nextImageId.toText();
    nextImageId += 1;

    let session : UploadSession = {
      totalChunks;
      receivedChunks = Map.empty<Nat, [Nat8]>();
      fileType;
    };

    uploadSessions.add(sessionId, session);
    sessionId;
  };

  public shared ({ caller }) func uploadChunk(sessionId : Text, chunkIndex : Nat, data : [Nat8]) : async () {
    switch (uploadSessions.get(sessionId)) {
      case (null) { Runtime.trap("Upload session not found") };
      case (?session) { session.receivedChunks.add(chunkIndex, data) };
    };
  };

  func assembleChunks(session : UploadSession) : [Nat8] {
    let resultList = List.empty<[Nat8]>();
    var chunkIndex = 0;

    while (chunkIndex < session.totalChunks) {
      switch (session.receivedChunks.get(chunkIndex)) {
        case (null) { Runtime.trap("Missing chunk at index $chunkIndex") };
        case (?chunk) { resultList.add(chunk) };
      };
      chunkIndex += 1;
    };

    var result : [Nat8] = [];
    for (chunk in resultList.values()) {
      result := result.concat(chunk);
    };
    result;
  };

  func applyEnhancement(image : [Nat8], mode : EnhancementMode) : [Nat8] {
    let result : [Nat8] = [];
    result.concat(image);
  };

  public shared ({ caller }) func finalizeUpload(sessionId : Text, mode : EnhancementMode) : async { ok : ?{ imageId : Text; enhancedImage : [Nat8] }; err : Text } {
    switch (uploadSessions.get(sessionId)) {
      case (null) {
        { ok = null; err = "no upload session found" };
      };
      case (?session) {
        if (session.receivedChunks.size() != session.totalChunks) {
          { ok = null; err = "all chunks not received yet" };
        } else {
          var chunkIndex = 0;
          while (chunkIndex < session.totalChunks) {
            if (session.receivedChunks.get(chunkIndex) == null) {
              return { ok = null; err = "missing chunk at index " # chunkIndex.toText() };
            };
            chunkIndex += 1;
          };

          let finalImage = assembleChunks(session);
          let imageId = "image-" # nextImageId.toText();
          nextImageId += 1;

          let enhancedImage = if (not finalImage.isEmpty()) {
            let processed = applyEnhancement(finalImage, mode);
            if (not processed.isEmpty()) {
              processed;
            } else { finalImage };
          } else { [] };

          images.add(imageId, enhancedImage);
          uploadSessions.remove(sessionId);

          { ok = ?{ imageId; enhancedImage }; err = "" };
        };
      };
    };
  };

  public query ({ caller }) func getImageRaw(imageId : Text) : async [Nat8] {
    switch (images.get(imageId)) {
      case (null) { Runtime.trap("Image not found") };
      case (?image) { image };
    };
  };

  public query ({ caller }) func getAllImageIds() : async [Text] {
    images.keys().toArray();
  };
};
