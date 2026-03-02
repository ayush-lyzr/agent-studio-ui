import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { Button } from '@/components/ui/button'
import { buttonVariants } from "@/components/custom/button";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
// import { cn } from '@/lib/utils'
import { Link } from "react-router-dom";

const ManageSeats = () => {
  return (
    <Dialog>
      <DialogTrigger className={buttonVariants()}>
        <Sparkles className="mr-1 size-4" />
        Manage Seats
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Seats</DialogTitle>
        </DialogHeader>
        <Separator />
        {/* <div className='space-y-4'>
          <p>Current team size is 35/35</p>
          <div className='flex justify-between items-start'>
            <span className='w-3/5'>
              <p className='font-semibold'>Add more seats</p>
              <p className='text-sm'>You can add empty seats now and assign people later as your team grows</p>
            </span>
            <div className='flex items-center'>
              <Button size="icon" variant="outline" className='rounded-s-lg rounded-e-none border-e-0'><Minus /></Button>
              <span className={cn(buttonVariants({variant: "outline", size: "icon"}), "rounded-none")}>35</span>
              <Button size="icon" variant="outline" className='rounded-e-lg rounded-s-none border-s-0'><Plus /></Button>
            </div>
          </div>
            <div className='flex justify-between items-center'>
              <p>Total Amount</p>
              <span className='inline-flex items-center'>
                <p className='text-lg font-bold'>$12</p>
                <p className='text-sm'>/month</p>
              </span>
            </div>
        </div> */}
        <p className="text-sm">
          Please contact our support team to further assist you. <br />
          <br />
          <Link
            to="mailto:help@lyzr.ai"
            className="text-blue-600 underline underline-offset-4"
          >
            Contact our sales team
          </Link>
        </p>
        {/* <Separator />
        <DialogFooter>
          <DialogClose className={buttonVariants({variant: "secondary"})}>Cancel</DialogClose>
          <Button>Submit</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default ManageSeats;
