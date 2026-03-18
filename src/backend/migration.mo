import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";

module {
  type EnhancementMode = {
    #standard;
    #anime;
  };

  type UploadSession = {
    totalChunks : Nat;
    receivedChunks : Map.Map<Nat, [Nat8]>;
    fileType : Text;
  };

  type OldActor = {
    images : Map.Map<Text, [Nat8]>;
    uploadSessions : Map.Map<Text, UploadSession>;
    nextImageId : Nat;
  };

  type NewActor = {
    images : Map.Map<Text, [Nat8]>;
    uploadSessions : Map.Map<Text, UploadSession>;
    nextImageId : Nat;
    visitCount : Nat;
  };

  public func run(old : OldActor) : NewActor {
    { old with visitCount = 0 };
  };
};
