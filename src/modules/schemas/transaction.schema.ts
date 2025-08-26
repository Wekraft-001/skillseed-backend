import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "./users/user.schema";
import { PaymentMethod } from "src/common/interfaces";
import { transactionType } from "src/common/interfaces/transaction-type.enum";

@Schema({ timestamps: true })
export class Transaction {

    @Prop({ index: true })
    schoolName?: string;

    @Prop({required: true, index: true})
    amount: number;

    @Prop({index: true})
    numberOfKids?: number;

    @Prop({enum: PaymentMethod, required: true, index: true, default: PaymentMethod.MOBILE_MONEY})
    paymentMethod: PaymentMethod;

    @Prop({ enum: transactionType, required: true, index: true, default: transactionType.SUBSCRIPTION})
    transactionType: transactionType;

    @Prop({required: true})
    transactionDate: Date;

    @Prop()
    notes: string;

    @Prop({type: Types.ObjectId, ref: 'School', index: true})
    school?: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'User', index: true})
    parent?: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'User', index: true})
    student?: Types.ObjectId;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

// Create compound indexes for efficient querying
TransactionSchema.index({ school: 1, transactionType: 1 });
TransactionSchema.index({ parent: 1, transactionType: 1 });
TransactionSchema.index({ student: 1, transactionType: 1 });

export type TransactionDocument = Transaction & Document;