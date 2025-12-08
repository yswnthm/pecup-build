import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";

export default function Loader() {
  return (
    <div className="relative">
      <AppleHelloEnglishEffect
        speed={1.1}
        className="h-16 sm:h-20 md:h-24 lg:h-28"
      />
    </div>
  );
}