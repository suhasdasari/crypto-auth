import { LoginCard } from "@/components/LoginCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <LoginCard />
      </div>
    </div>
  );
}
