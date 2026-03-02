import React from "react";
import ContentRenderer from "./hybrid-react-render";

interface Activity {
  time_stamp: string;
  log_data: {
    content: string;
  };
  session_id: string;
  user_id: string;
}

interface ActivityTimelineProps {
  activeTab: string;
  activities: Activity[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activeTab,
  activities,
}) => {
  return (
    <>
      {activeTab === "activity" && (
        <div className="prose max-w-none text-sm leading-relaxed">
          {activities.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500">No activities found.</p>
            </div>
          ) : (
            <div>
              <div>{/* <p className="mr-2 text-lg"> Timeline</p> */}</div>
              <div className="relative">
                {/* Vertical Timeline Line */}

                <div className="absolute bottom-0 left-[61px] top-0 w-[2px] bg-gray-300"></div>
                <div className="ml-10 space-y-8">
                  {[...activities]
                    .slice()
                    .reverse()
                    .map((activity, index) => (
                      <div key={index} className="relative pl-6">
                        {/* Timeline Marker with Ripple Effect */}
                        <div className="absolute left-[22px] top-0 h-4 w-4 -translate-x-1/2 transform rounded-full border-2 border-white bg-blue-500 shadow">
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              animation: "ripple 1.5s infinite",
                              background: "rgba(33, 150, 243, 0.3)",
                            }}
                          ></div>
                        </div>
                        {/* Activity Content */}
                        <div className="ml-10 flex flex-col">
                          <span className="text-sm font-semibold text-gray-600">
                            <span className="text-xl text-amber-400">
                              {" "}
                              Thinking {activities.length - index}{" "}
                            </span>
                            <span className="text-xs">
                              {" "}
                              {activity.time_stamp}
                            </span>
                          </span>
                          <div className="mt-2 space-y-2">
                            <div>
                              {/* <strong className="block text-gray-700">
                                Activity:
                              </strong> */}
                              <ContentRenderer
                                content={activity.log_data.content}
                                loading={false}
                              />
                            </div>
                            {/* <div>
                              <strong className="text-gray-700">
                                Session ID:
                              </strong>{" "}
                              {activity.session_id}
                            </div>
                            <div>
                              <strong className="text-gray-700">
                                User ID:
                              </strong>{" "}
                              {activity.user_id}
                            </div> */}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Adding the ripple keyframes directly within the component
const style = document.createElement("style");
style.textContent = `
@keyframes ripple {
    0% {
        transform: scale(0.8);
        opacity: 1;
    }
    100% {
        transform: scale(2.4);
        opacity: 0;
    }
}
`;
document.head.append(style);

export default ActivityTimeline;
