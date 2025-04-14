import styled from "styled-components";

export const NavBar = styled.nav`
  background: rgb(99,74,35);
  background: -moz-linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  background: -webkit-linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  background: linear-gradient(90deg, rgba(99,74,35,1) 0%, rgba(146,101,57,1) 100%);
  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#634a23",endColorstr="#926539",GradientType=1);
  display: flex;
  justify-content: center; 
  align-items: center;
  padding: 10px 50px; 
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 100;
  box-sizing: border-box;
`;

export const LogoImg = styled.img`
  width: 50px;
  cursor: pointer;
  margin-left: 0; 
  flex-shrink: 0;
`;

export const NavContent = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  max-width: 1200px; 
  margin: 0 auto; 
`;

export const Menu = styled.ul`
  display: flex;
  list-style: none;
  gap: 30px;
  margin: 0;
  padding: 0;
  width: 100%;
  justify-content: center;
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

export const MenuItem = styled.li`
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  color: white;
  padding: 5px 10px; 

  &:hover {
    text-decoration: underline;
  }
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  margin-right: 0; 

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

export const IconButton = styled.img`
  width: 35px;
  height: 35px;
  cursor: pointer;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

export const LoginButton = styled.button`
  padding: 10px 15px;
  background-color: white;
  color: black;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
  white-space: nowrap;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const DropdownMenu = styled.div`
  position: absolute;
  top: 50px;
  right: 0;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  overflow: hidden;
  z-index: 100;
`;

export const DropdownMenuItem = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background-color:rgb(0, 0, 0);
  }
`;

export const NotificationDropdown = styled(DropdownMenu)`
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
`;

export const NotificationItem = styled.div`
  padding: 15px;
  border-bottom: 1px solidrgb(12, 8, 8);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color:rgb(0, 0, 0);
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const NotificationTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
`;

export const NotificationDescription = styled.div`
  font-size: 0.9rem;
  color: #555;
`;

export const NotificationTime = styled.span`
  font-size: 0.8rem;
  color: #999;
`;

export const UnreadIndicator = styled.div`
  width: 8px;
  height: 8px;
  background-color: #E74C3C;
  border-radius: 50%;
  margin-right: 10px;
  display: ${props => (props.read ? "none" : "block")};
`;

export const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #E74C3C;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
`;

export const NotificationHeader = styled.div`
  padding: 15px;
  font-weight: bold;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
`;

export const NotificationIconContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    gap: 6px;
  }
`;

export const NoNotifications = styled.div`
  padding: 20px;
  text-align: center;
  color: #777;
`;

export const UserName = styled.span`
  padding: 6px 12px;
  background-color: white;
  color:rgb(0, 0, 0);
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 12px;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 4px 8px;
  }
`;
