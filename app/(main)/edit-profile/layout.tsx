import { getUserRole } from "@/app/api/users";

export default async function EditProfileLayout({  children,
    player,
    club,
    coach,
  }: {
    children: React.ReactNode;
    player: React.ReactNode;
    club: React.ReactNode;
    coach: React.ReactNode;
  }) {
    const userRole = await getUserRole();
  
    let contentToRender;
  
    if (userRole === 'PLAYER') {
      contentToRender = player;
    } else if (userRole === 'CLUB') {
      contentToRender = club;
    } else if (userRole === 'COACH') {
      contentToRender = coach;
    } else {
      contentToRender = children; // Default content for guests or undefined roles
    }
  
    return (
      <div className="container py-6">
        {contentToRender}
      </div>
    );
  } 